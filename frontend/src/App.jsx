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
    </Routes>
  );
}

export default App;