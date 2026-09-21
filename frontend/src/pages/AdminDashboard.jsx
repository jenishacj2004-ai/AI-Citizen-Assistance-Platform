import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const role = localStorage.getItem("user_role");
  const userName = localStorage.getItem("user_name");

  // Admin protection
  if (role !== "Admin") {
    navigate("/dashboard");
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-[#111c30] px-6 py-4">

        <div>
          <h1 className="text-2xl font-bold">
            Admin Dashboard
          </h1>

          <p className="text-sm text-gray-400">
            Welcome, {userName}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium hover:bg-red-700"
        >
          Logout
        </button>

      </header>

      {/* Main content */}
      <main className="p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Administration
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Government Services */}
          <div className="rounded-xl border border-gray-700 bg-[#111c30] p-6">

            <h3 className="mb-2 text-lg font-semibold">
              Government Services
            </h3>

            <p className="mb-5 text-sm text-gray-400">
              Add, edit, activate, deactivate and delete government services.
            </p>

            <button
                onClick={() => navigate("/admin/services")}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700"
            >
            Manage Services
            </button>

          </div>

          {/* Users */}
          <div className="rounded-xl border border-gray-700 bg-[#111c30] p-6">

            <h3 className="mb-2 text-lg font-semibold">
              Users
            </h3>

            <p className="mb-5 text-sm text-gray-400">
              View and manage registered citizens.
            </p>

            <button
              className="rounded-lg bg-gray-600 px-4 py-2 font-medium"
            >
              Manage Users
            </button>

          </div>

          {/* Documents */}
          <div className="rounded-xl border border-gray-700 bg-[#111c30] p-6">

            <h3 className="mb-2 text-lg font-semibold">
              Documents
            </h3>

            <p className="mb-5 text-sm text-gray-400">
              Monitor citizen document verification.
            </p>

            <button
              className="rounded-lg bg-gray-600 px-4 py-2 font-medium"
            >
              View Documents
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;