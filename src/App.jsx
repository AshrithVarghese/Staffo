import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import Notfound from './pages/Notfound.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* User dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allow={["student", "default", "staff"]}>
                <Dashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Staff dashboard */}
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

        <Route path="/*" element={<Notfound />} />
      </Routes>
    </>
  )
}

export default App
