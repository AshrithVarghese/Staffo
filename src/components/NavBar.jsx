import React from 'react'
import { House, CalendarCheck, Users, UserCircle, ListMagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();

  const handleSignOut = () =>{
    localStorage.removeItem("supabase.auth.token");
    navigate("/login");
  };

  return (
    <nav className="fixed bottom-5 left-5 right-5 rounded-full bg-black border-t border-gray-200 z-50 px-4 py-2 flex justify-between items-center gap-2">
      
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

      
    </nav>
  );
};

export default NavBar;
