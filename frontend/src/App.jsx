import { Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AIRecommendation from "./pages/AIRecommendation";
import Landing from "./pages/Landing";
import Eligibility from "./pages/Eligibility";
import GovernmentServices from "./pages/GovernmentServices";
import ServiceDetails from "./pages/ServiceDetails";
import DocumentVerification from "./pages/DocumentVerification";
import AdminDashboard from "./pages/AdminDashboard";
import AdminServices from "./pages/AdminServices";
import AdminEligibilityRules from "./pages/AdminEligibilityRules";
import AdminNotifications from "./pages/AdminNotifications";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/recommendation" element={<AIRecommendation />}  />
      <Route path="/eligibility" element={<Eligibility />} />
      <Route path="/services" element={<GovernmentServices />} />
      <Route path="/services/:serviceId" element={<ServiceDetails />} />
      <Route path="/documents" element={<DocumentVerification />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/services" element={<AdminServices />} />
      <Route path="/admin/services/:serviceId/eligibility-rules" element={<AdminEligibilityRules />} />
      <Route path="/admin/notifications" element={<AdminNotifications />}/>
      <Route path="/notifications" element={<Notifications />} />
    </Routes>
  );
}

export default App;