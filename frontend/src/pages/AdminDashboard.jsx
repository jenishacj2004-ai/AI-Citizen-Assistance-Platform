import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminDashboard() {
  const navigate = useNavigate();

  const role = localStorage.getItem("user_role");
  const userName = localStorage.getItem("user_name") || "Administrator";
  const userId = localStorage.getItem("user_id");

  // State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'services'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal State for Add / Edit Service
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const initialFormState = {
    service_name: "",
    department: "",
    description: "",
    eligibility: "",
    required_documents: "",
    application_link: "",
    category: "General",
    service_type: "Certificate",
    age_min: 0,
    age_max: 120,
    income_limit: 0,
    occupation: "All",
    state: "Kerala",
    eligibility_mode: "Rule Based",
    applicant_type: "Self",
  };

  const [formData, setFormData] = useState(initialFormState);

  // Admin authentication guard
  useEffect(() => {
    if (role !== "Admin") {
      navigate("/dashboard");
      return;
    }

    fetchServices();
  }, [role, navigate]);

  // Fetch Services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/admin/services?user_id=${userId}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to load services:", data.detail);
        return;
      }

      setServices(data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  // Helper to determine eligibility mode (with fallback for legacy records)
  const getEligibilityMode = (service) => {
    if (service.eligibility_mode) return service.eligibility_mode;
    const name = (service.service_name || "").toLowerCase();
    if (
      name.includes("income") ||
      name.includes("caste") ||
      name.includes("residence")
    ) {
      return "Profile Based";
    }
    if (name.includes("birth") || name.includes("death")) {
      return "Event Based";
    }
    return "Rule Based";
  };

  // Helper to determine applicant type (with fallback for legacy records)
  const getApplicantType = (service) => {
    if (service.applicant_type) return service.applicant_type;
    const name = (service.service_name || "").toLowerCase();
    if (name.includes("birth") || name.includes("death")) {
      return "Parent/Guardian";
    }
    if (name.includes("ayushman") || name.includes("karunya")) {
      return "Self/Patient";
    }
    if (name.includes("awas")) {
      return "Self/Family";
    }
    return "Self";
  };

  // Activate / Deactivate Service
  const changeStatus = async (service) => {
    const newStatus = service.status === "Active" ? "Inactive" : "Active";
    try {
      const response = await fetch(
        `${API_URL}/admin/services/${service.service_id}/status?user_id=${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to change status");
        return;
      }

      fetchServices();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  // Delete Service
  const deleteService = async (serviceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this government service?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/services/${serviceId}?user_id=${userId}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to delete service");
        return;
      }

      fetchServices();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  // Open Add Service Modal
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setFormData(initialFormState);
    setModalError("");
    setIsModalOpen(true);
  };

  // Open Edit Service Modal
  const handleOpenEditModal = (service) => {
    setEditingServiceId(service.service_id);
    setFormData({
      service_name: service.service_name || "",
      department: service.department || "",
      description: service.description || "",
      eligibility: service.eligibility || "",
      required_documents: service.required_documents || "",
      application_link: service.application_link || "",
      category: service.category || "General",
      service_type: service.service_type || "Certificate",
      age_min: service.age_min ?? 0,
      age_max: service.age_max ?? 120,
      income_limit: service.income_limit ?? 0,
      occupation: service.occupation || "All",
      state: service.state || "Kerala",
      eligibility_mode: getEligibilityMode(service),
      applicant_type: getApplicantType(service),
    });
    setModalError("");
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      const payload = {
        ...formData,
        age_min: parseInt(formData.age_min, 10) || 0,
        age_max: parseInt(formData.age_max, 10) || 120,
        income_limit: parseFloat(formData.income_limit) || 0,
      };

      let url = `${API_URL}/admin/services?user_id=${userId}`;
      let method = "POST";

      if (editingServiceId) {
        url = `${API_URL}/admin/services/${editingServiceId}?user_id=${userId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalError(data.detail || "Operation failed. Please check inputs.");
        return;
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error(error);
      setModalError("Unable to connect to backend server.");
    } finally {
      setModalLoading(false);
    }
  };

  // Computed Statistics
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === "Active").length;
  const inactiveServices = services.filter((s) => s.status === "Inactive").length;

  const profileBasedCount = services.filter(
    (s) => getEligibilityMode(s) === "Profile Based"
  ).length;

  const ruleBasedCount = services.filter(
    (s) => getEligibilityMode(s) === "Rule Based"
  ).length;

  const eventBasedCount = services.filter(
    (s) => getEligibilityMode(s) === "Event Based"
  ).length;

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        service.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const mode = getEligibilityMode(service);
      const matchesMode =
        modeFilter === "ALL" || mode.toUpperCase() === modeFilter.toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "Active" && service.status === "Active") ||
        (statusFilter === "Inactive" && service.status === "Inactive");

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [services, searchQuery, modeFilter, statusFilter]);

  // Mode badge stylings
  const renderModeBadge = (mode) => {
    switch (mode) {
      case "Profile Based":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Profile Based
          </span>
        );
      case "Event Based":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Event Based
          </span>
        );
      case "Rule Based":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Rule Based
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070d18] text-slate-100 font-sans antialiased">
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR                                                              */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d1627] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white font-bold text-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-base text-white tracking-tight leading-tight">
                  Citizen Portal
                </h1>
                <p className="text-xs text-blue-400 font-medium">
                  Admin Control Center
                </p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 text-sm font-medium">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/services");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Government Services</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                {totalServices}
              </span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/services");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span>Eligibility Rules</span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/notifications");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span>Notifications</span>
            </button>

            {/* Non-functional / Visual items preserved */}
            <div className="pt-2">
              <div className="px-3 pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Management
              </div>
              <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-slate-500 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>Users</span>
                </div>
                <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400">
                  Auth DB
                </span>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: Admin Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#09101d]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-semibold text-sm shadow">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">
                {userName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <p className="text-xs text-slate-400">Admin Role</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent text-sm font-medium transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-[#0d1627]/90 backdrop-blur border-b border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage government services and eligibility configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Service</span>
            </button>

            <button
              onClick={() => navigate("/admin/notifications")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700/80 transition-colors"
            >
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <span>Announce</span>
            </button>
          </div>
        </header>

        {/* Dashboard Main View */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* ================================================================= */}
          {/* SUMMARY METRIC CARDS                                              */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Services */}
            <div className="rounded-xl bg-[#0f192d] border border-slate-800/90 p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Services
                </span>
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {loading ? "..." : totalServices}
                </span>
                <span className="text-xs text-slate-400">Services Catalog</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Managed across government departments
              </p>
            </div>

            {/* Card 2: Active Services */}
            <div className="rounded-xl bg-[#0f192d] border border-slate-800/90 p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Services
                </span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-400 tracking-tight">
                  {loading ? "..." : activeServices}
                </span>
                <span className="text-xs text-emerald-500/80 font-medium">
                  Operational
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Visible to citizens on eligibility portal
              </p>
            </div>

            {/* Card 3: Inactive Services */}
            <div className="rounded-xl bg-[#0f192d] border border-slate-800/90 p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Inactive Services
                </span>
                <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-300 tracking-tight">
                  {loading ? "..." : inactiveServices}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Paused / Draft
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Deactivated from citizen search
              </p>
            </div>

            {/* Card 4: Eligibility Configuration Overview */}
            <div className="rounded-xl bg-[#0f192d] border border-slate-800/90 p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Eligibility Config
                </span>
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                <div className="bg-emerald-500/10 rounded py-1 border border-emerald-500/20">
                  <div className="text-xs font-bold text-emerald-400">
                    {profileBasedCount}
                  </div>
                  <div className="text-[10px] text-slate-400">Profile</div>
                </div>
                <div className="bg-purple-500/10 rounded py-1 border border-purple-500/20">
                  <div className="text-xs font-bold text-purple-400">
                    {ruleBasedCount}
                  </div>
                  <div className="text-[10px] text-slate-400">Rule</div>
                </div>
                <div className="bg-amber-500/10 rounded py-1 border border-amber-500/20">
                  <div className="text-xs font-bold text-amber-400">
                    {eventBasedCount}
                  </div>
                  <div className="text-[10px] text-slate-400">Event</div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 text-center">
                Three-tier classification system
              </p>
            </div>
          </div>

          {/* ================================================================= */}
          {/* ELIGIBILITY CONFIGURATION SECTION (VISUAL SUMMARY)               */}
          {/* ================================================================= */}
          <section className="rounded-xl bg-[#0d1627] border border-slate-800/80 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    Eligibility Configuration
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    Architecture Overview
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Summary of services classified by eligibility evaluation modes
                </p>
              </div>
              <p className="text-xs text-slate-400 italic">
                "Eligibility rules are configured separately for each service."
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profile Based Card */}
              <div className="p-4 rounded-lg bg-[#0a1120] border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <h3 className="text-sm font-semibold text-emerald-400">
                      Profile Based
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    {profileBasedCount} {profileBasedCount === 1 ? "Service" : "Services"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates directly against verified citizen demographic and socio-economic profile attributes.
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>e.g., Income, Caste, Residence</span>
                  <span className="text-emerald-400/90 font-medium">Auto-matched</span>
                </div>
              </div>

              {/* Rule Based Card */}
              <div className="p-4 rounded-lg bg-[#0a1120] border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    <h3 className="text-sm font-semibold text-purple-400">
                      Rule Based
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs">
                    {ruleBasedCount} {ruleBasedCount === 1 ? "Service" : "Services"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates dynamic multi-criteria logic, thresholds, land records, or categorical requirements.
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>e.g., PM-KISAN, E-Grantz, Mudra</span>
                  <span className="text-purple-400/90 font-medium">Configurable Rules</span>
                </div>
              </div>

              {/* Event Based Card */}
              <div className="p-4 rounded-lg bg-[#0a1120] border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <h3 className="text-sm font-semibold text-amber-400">
                      Event Based
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
                    {eventBasedCount} {eventBasedCount === 1 ? "Service" : "Services"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Triggered on lifecycle event registrations and verified by authorized guardians or relatives.
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>e.g., Birth & Death Registration</span>
                  <span className="text-amber-400/90 font-medium">Lifecycle Events</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* GOVERNMENT SERVICES OVERVIEW TABLE                                */}
          {/* ================================================================= */}
          <section className="rounded-xl bg-[#0d1627] border border-slate-800/80 overflow-hidden shadow-xl">
            {/* Header & Controls */}
            <div className="p-5 border-b border-slate-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    Government Services
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive catalog with eligibility modes, applicant roles, and management actions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/admin/services")}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Manage Services View
                  </button>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    + Add Service
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by service, department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#080e1a] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <svg
                    className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Eligibility Mode Filter */}
                <div>
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="w-full bg-[#080e1a] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="ALL">All Eligibility Modes</option>
                    <option value="Profile Based">Profile Based</option>
                    <option value="Rule Based">Rule Based</option>
                    <option value="Event Based">Event Based</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-[#080e1a] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table or Loading State */}
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Loading government services...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <svg
                  className="w-12 h-12 mx-auto text-slate-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-slate-300">
                  No matching services found
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting search query or filter options.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#091120] text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Eligibility Mode</th>
                      <th className="py-3.5 px-4">Applicant Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredServices.map((service) => {
                      const mode = getEligibilityMode(service);
                      const applicant = getApplicantType(service);

                      return (
                        <tr
                          key={service.service_id}
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          {/* Service Name & Category */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-100 text-sm">
                              {service.service_name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400">
                                {service.category || "General"}
                              </span>
                              {service.service_type && (
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">
                                  {service.service_type}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-4 text-slate-300 font-medium">
                            {service.department || "General Administration"}
                          </td>

                          {/* Eligibility Mode Badge */}
                          <td className="py-3.5 px-4">
                            {renderModeBadge(mode)}
                          </td>

                          {/* Applicant Type */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                              {applicant}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {service.status === "Active" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/30 text-slate-400 border border-slate-700/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(service)}
                                title="Edit Service Details"
                                className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-transparent transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>

                              {/* Eligibility Rules Button */}
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/services/${service.service_id}/eligibility-rules`
                                  )
                                }
                                title="Configure Eligibility Rules"
                                className="p-1.5 rounded-md bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 hover:border-transparent transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                  />
                                </svg>
                              </button>

                              {/* Status Toggle Button */}
                              <button
                                onClick={() => changeStatus(service)}
                                title={
                                  service.status === "Active"
                                    ? "Deactivate Service"
                                    : "Activate Service"
                                }
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                  service.status === "Active"
                                    ? "bg-amber-500/10 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-500/20 hover:border-transparent"
                                    : "bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/20 hover:border-transparent"
                                }`}
                              >
                                {service.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => deleteService(service.service_id)}
                                title="Delete Service"
                                className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* QUICK ACCESS ACTIONS & SYSTEM UTILITIES                           */}
          {/* ================================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1: Notifications */}
            <div className="p-5 rounded-xl bg-[#0f192d] border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-white">
                    Citizen Notifications
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Broadcast administrative updates, scheme deadlines, and system announcements.
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/notifications")}
                className="mt-4 w-full px-3 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-semibold transition-colors"
              >
                Send Announcements &rarr;
              </button>
            </div>

            {/* Action 2: Rule Management */}
            <div className="p-5 rounded-xl bg-[#0f192d] border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-white">
                    Services Rule Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Define condition operators, criteria thresholds, and requirements per service.
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/services")}
                className="mt-4 w-full px-3 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 text-xs font-semibold transition-colors"
              >
                Configure Service Rules &rarr;
              </button>
            </div>

            {/* Action 3: Citizen Portal Preview */}
            <div className="p-5 rounded-xl bg-[#0f192d] border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-white">
                    Citizen Portal View
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Preview the citizen dashboard and test end-to-end AI eligibility checks.
                </p>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-4 w-full px-3 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-xs font-semibold transition-colors"
              >
                Go to Citizen Dashboard &rarr;
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT SERVICE MODAL                                                  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d1627] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingServiceId ? "Edit Government Service" : "Add Government Service"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure service attributes, eligibility mode, and target applicant type
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Service Name */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.service_name}
                    onChange={(e) =>
                      setFormData({ ...formData, service_name: e.target.value })
                    }
                    placeholder="e.g. Income Certificate, PM-KISAN..."
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="e.g. Revenue, Agriculture, Education..."
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g. General, Welfare, Financial..."
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Eligibility Mode */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Eligibility Mode *
                  </label>
                  <select
                    value={formData.eligibility_mode}
                    onChange={(e) =>
                      setFormData({ ...formData, eligibility_mode: e.target.value })
                    }
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Profile Based">Profile Based (Income, Caste, Residence)</option>
                    <option value="Rule Based">Rule Based (Multi-condition logic)</option>
                    <option value="Event Based">Event Based (Birth, Death, Milestones)</option>
                  </select>
                </div>

                {/* Applicant Type */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Applicant Type *
                  </label>
                  <select
                    value={formData.applicant_type}
                    onChange={(e) =>
                      setFormData({ ...formData, applicant_type: e.target.value })
                    }
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Self">Self</option>
                    <option value="Parent/Guardian">Parent/Guardian</option>
                    <option value="Family Member/Authorized Person">Family Member/Authorized Person</option>
                    <option value="Self/Family">Self/Family</option>
                    <option value="Self/Patient">Self/Patient</option>
                  </select>
                </div>

                {/* Age Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Min Age
                    </label>
                    <input
                      type="number"
                      value={formData.age_min}
                      onChange={(e) =>
                        setFormData({ ...formData, age_min: e.target.value })
                      }
                      className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Max Age
                    </label>
                    <input
                      type="number"
                      value={formData.age_max}
                      onChange={(e) =>
                        setFormData({ ...formData, age_max: e.target.value })
                      }
                      className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Income Limit */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Income Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.income_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, income_limit: e.target.value })
                    }
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Target Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) =>
                      setFormData({ ...formData, occupation: e.target.value })
                    }
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Application Link */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Application Portal Link
                  </label>
                  <input
                    type="url"
                    value={formData.application_link}
                    onChange={(e) =>
                      setFormData({ ...formData, application_link: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Service Description
                  </label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide a clear description of the scheme or certificate..."
                    className="w-full bg-[#070d18] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors"
                >
                  {modalLoading
                    ? "Saving..."
                    : editingServiceId
                    ? "Update Service"
                    : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;