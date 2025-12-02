import React from 'react'
import { House, CalendarCheck, Users, UserCircle } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

const NavBar = () => {
  const items = [
    { to: "/", icon: <House size={22} className='text-white'/>, label: "Home" },
    { to: "/dashboard", icon: <Users size={22} className='text-white'/>, label: "Staff" },
    { to: "/meetings", icon: <CalendarCheck size={22} className='text-white'/>, label: "Meetings" },
    { to: "/staffdashboard", icon: <UserCircle size={22} className='text-white'/>, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-5 left-5 right-5 rounded-full bg-black border-t border-gray-200 z-50 px-4 py-2 flex justify-between items-center gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 
             ${isActive ? "text-blue-600 font-semibold" : "text-gray-500"}`
          }
        >
          {item.icon}
          <span className="text-xs mt-0.5 text-white">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default NavBar