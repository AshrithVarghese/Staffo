import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

const APP_VERSION = "1.0.0"; // change dynamically if needed

export default function LandingPopup() {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

    const fetchAnnouncement = async () => {
    const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

    if (error) {
        console.error(error);
        setLoading(false);
        return;
    }

    if (!data || data.length === 0) {
        setLoading(false);
        return;
    }

    const now = new Date();

    const validAnnouncements = data.filter((item) => {
        const notExpired =
        !item.expires_at || new Date(item.expires_at) > now;

        const versionMismatch =
        item.type === "update"
            ? item.version !== APP_VERSION
            : true;

        const dismissed = localStorage.getItem(
        `announcement-${item.id}`
        );

        const shouldForce = item.force_show === true;

        return notExpired && versionMismatch && (!dismissed || shouldForce);
    });

    if (validAnnouncements.length > 0) {
        setAnnouncement(validAnnouncements[0]); // highest priority
    }

    setLoading(false);
    };

  const handleClose = () => {
    if (announcement) {
      localStorage.setItem(
        `announcement-${announcement.id}`,
        "dismissed"
      );
    }
    setAnnouncement(null);
  };

  if (loading || !announcement) return null;

  const getBorderStyle = () => {
    switch (announcement.type) {
      case "emergency":
        return "border-red-600";
      case "update":
        return "border-black";
      default:
        return "border-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-white max-w-lg w-[90%] rounded-xl shadow-2xl border-l-4 ${getBorderStyle()} p-6 relative`}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-2 tracking-tight">
          {announcement.title}
        </h2>

        <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
          {announcement.message}
        </p>

        {announcement.type === "emergency" && (
          <div className="mt-4 text-xs font-semibold text-red-600">
            Emergency Notice
          </div>
        )}

        {announcement.type === "info" && (
          <div className="mt-4 text-xs font-semibold text-black">
            New Announcement
          </div>
        )}

        {announcement.type === "update" && (
          <div className="mt-4 text-xs font-semibold text-black">
            New Version Rolled Out
          </div>
        )}

        {announcement.button && announcement.button_link && (
          <a href={announcement.button_link} target="_blank" rel="noopener noreferrer">
            <button className="mt-4 text-xs font-semibold bg-black text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-colors">
              {announcement.button}
            </button>
          </a>
        )}
      </div>
    </div>
  );
}