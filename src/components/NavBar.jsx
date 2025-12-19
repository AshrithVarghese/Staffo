import React, { useState, useEffect } from 'react'
import { House, CalendarCheck, Users, UserCircle, ListMagnifyingGlass, SignOut, UserGear } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const NavBar = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return null;
  }

  if (!userRole || userRole === "student") {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-5 right-5 rounded-full bg-black border-t border-gray-200 z-50 px-4 py-2 flex justify-between items-center gap-2">
      
      <NavLink to="/dashboard" className="relative flex flex-col items-center justify-center flex-1 py-1">
        {({ isActive }) => (
          <>
            <House size={22} className="text-white" />
            <span className="text-xs mt-0.5 text-white">Home</span>
            {isActive && (
              <span className="absolute bottom-2 translate-y-1.5 w-1/5 h-0.5 bg-white "></span>
            )}
          </>
        )}
      </NavLink>

      <NavLink to="/meetings" className="relative flex flex-col items-center justify-center flex-1 py-1">
        {({ isActive }) => (
          <>
            <CalendarCheck size={22} className="text-white" />
            <span className="text-xs mt-0.5 text-white">Meetings</span>
            {isActive && (
              <span className="absolute bottom-2 translate-y-1.5 w-1/5 h-0.5 bg-white "></span>
            )}
          </>
        )}
      </NavLink>

      <NavLink to="/availability" className="relative flex flex-col items-center justify-center flex-1 py-1">
        {({ isActive }) => (
          <>
            <ListMagnifyingGlass size={22} className="text-white" />
            <span className="text-xs mt-0.5 text-white">Availability</span>
            {isActive && (
              <span className="absolute bottom-2 translate-y-1.5 w-1/5 h-0.5 bg-white "></span>
            )}
          </>
        )}
      </NavLink>

      <NavLink to="/staffdashboard" className="relative flex flex-col items-center justify-center flex-1 py-1">
        {({ isActive }) => (
          <>
            <UserCircle size={22} className="text-white" />
            <span className="text-xs mt-0.5 text-white">Dashboard</span>
            {isActive && (
              <span className="absolute bottom-2 translate-y-1.5 w-1/5 h-0.5 bg-white rounded-full"></span>
            )}
          </>
        )}
      </NavLink>

      {userRole == "admin" && (
      <NavLink to="/admins" className="relative flex flex-col items-center justify-center flex-1 py-1">
        {({ isActive }) => (
          <>
            <UserGear size={22} className="text-white" />
            <span className="text-xs mt-0.5 text-white">Admin</span>
            {isActive && (
              <span className="absolute bottom-2 translate-y-1.5 w-1/5 h-0.5 bg-white rounded-full"></span>
            )}
          </>
        )}
      </NavLink>
      )}

      
    </nav>
  );
};

export default NavBar;
