import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminServices() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("user_role");

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin protection
  useEffect(() => {
    if (role !== "Admin") {
      navigate("/dashboard");
      return;
    }

    fetchServices();
  }, [role, navigate]);

  // GET /admin/services
  const fetchServices = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/services?user_id=${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to load services");
        return;
      }

      setServices(data.services || []);

    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");

    } finally {
      setLoading(false);
    }
  };

  // Change Active / Inactive
  const changeStatus = async (service) => {
    const newStatus =
      service.status === "Active" ? "Inactive" : "Active";

    try {
      const response = await fetch(
        `${API_URL}/admin/services/${service.service_id}/status?user_id=${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to change status");
        return;
      }

      alert(data.message);

      fetchServices();

    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  // Delete service
  const deleteService = async (serviceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this government service?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/services/${serviceId}?user_id=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to delete service");
        return;
      }

      alert(data.message);

      fetchServices();

    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-[#111c30] px-6 py-4">

        <div>
          <h1 className="text-2xl font-bold">
            Manage Government Services
          </h1>

          <p className="text-sm text-gray-400">
            Admin Service Management
          </p>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-700"
        >
          Back to Admin
        </button>

      </header>

      {/* Content */}
      <main className="p-6">

        {/* Top section */}
        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold">
              Government Services
            </h2>

            <p className="text-sm text-gray-400">
              Total services: {services.length}
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/services/add")}
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium hover:bg-blue-700"
          >
            + Add Service
          </button>

        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-[#111c30] p-6 text-center text-gray-400">
            Loading services...
          </div>
        )}

        {/* Empty */}
        {!loading && services.length === 0 && (
          <div className="rounded-xl bg-[#111c30] p-6 text-center text-gray-400">
            No government services found.
          </div>
        )}

        {/* Services */}
        {!loading && services.length > 0 && (
          <div className="grid grid-cols-1 gap-5">

            {services.map((service) => (

              <div
                key={service.service_id}
                className="rounded-xl border border-gray-700 bg-[#111c30] p-6"
              >

                {/* Service header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row">

                  <div>

                    <h3 className="text-xl font-semibold">
                      {service.service_name}
                    </h3>

                    <p className="mt-1 text-sm text-blue-400">
                      {service.department}
                    </p>

                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        service.status === "Active"
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>

                </div>

                {/* Details */}
                <div className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">

                  <div>
                    <p className="text-gray-400">Service Type</p>
                    <p>{service.service_type || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Category</p>
                    <p>{service.category || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Occupation</p>
                    <p>{service.occupation || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Age Range</p>
                    <p>
                      {service.age_min} - {service.age_max}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Income Limit</p>
                    <p>
                      ₹{service.income_limit ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">State</p>
                    <p>{service.state || "-"}</p>
                  </div>

                </div>

                {/* Description */}
                <div className="mt-5">

                  <p className="text-sm text-gray-400">
                    Description
                  </p>

                  <p className="mt-1 text-sm text-gray-200">
                    {service.description || "-"}
                  </p>

                </div>

                {/* Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/services/edit/${service.service_id}`
                      )
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => changeStatus(service)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      service.status === "Active"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {service.status === "Active"
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    onClick={() =>
                      deleteService(service.service_id)
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </main>
    </div>
  );
}

export default AdminServices;