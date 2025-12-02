import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "./utils/supabase";

import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/StaffDashboard";
import MeetingDashboard from "./pages/MeetingDashboard";
import Notfound from "./pages/Notfound";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import toast from "react-hot-toast";

// -----------------------------------------
// Notification helpers
// -----------------------------------------
function playNotificationSound() {
  const audio = new Audio("/notification.mp3");
  audio.play().catch(() => { });
}

function showToast(title, body) {
  toast.success(`${title}\n${body}`);
}

// -----------------------------------------
// Meeting wrapper → uses ?staffId=
// -----------------------------------------
function MeetingDashboardWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const staffId = params.get("staffId");

  return <MeetingDashboard staffId={staffId} />;
}

// -----------------------------------------
// Main App
// -----------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [staffId, setStaffId] = useState(null);

  // ------------------------------
  // Auth session listener
  // ------------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ------------------------------
  // Fetch staff table → staff.id
  // ------------------------------
  useEffect(() => {
    if (!user?.id) {
      setStaffId(null);
      return;
    }

    const loadStaff = async () => {
      const { data } = await supabase
        .from("staff")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      setStaffId(data?.id ?? null);
    };

    loadStaff();
  }, [user?.id]);

  // ------------------------------
  // Real-time notifications
  // ------------------------------
  useEffect(() => {
    if (!staffId) return;

    const channel = supabase
      .channel(`notification_${staffId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          table: "notifications",
          schema: "public",
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => {
          playNotificationSound();
          showToast(payload.new.title, payload.new.body);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [staffId]);

  // ------------------------------
  // Routes
  // ------------------------------
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Student/Admin Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff Dashboard */}
        <Route
          path="/staffdashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allow={["staff"]}>
                <StaffDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Meetings page (requires staffId) */}
        <Route
          path="/meetings"
          element={
            <ProtectedRoute>
              <RoleRoute allow={["staff"]}>
                <MeetingDashboardWrapper />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="/*" element={<Notfound />} />
      </Routes>
    </>
  );
}
