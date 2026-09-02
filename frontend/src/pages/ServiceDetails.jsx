import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/government-services/${serviceId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load service details"
        );
      }

      setService(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert comma-separated documents into an array
  const getDocuments = () => {
    if (!service?.required_documents) {
      return [];
    }

    if (Array.isArray(service.required_documents)) {
      return service.required_documents;
    }

    return service.required_documents
      .split(",")
      .map((doc) => doc.trim())
      .filter(Boolean);
  };

  const documents = getDocuments();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading service details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-4">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-center">
          <p className="text-red-300">{error}</p>

          <button
            onClick={() => navigate("/services")}
            className="mt-4 rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-[#0b101b] lg:flex lg:flex-col">

        {/* Logo */}
        <div className="border-b border-white/10 px-6 py-5">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
          >
            Citizen<span className="text-indigo-400">AI</span>
          </Link>

          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Digital Citizenship
          </p>
        </div>

        <div className="flex-1 px-4 py-6">

          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="▦"
              label="Overview"
              onClick={() => navigate("/dashboard")}
            />

            <SidebarItem
              icon="⌕"
              label="Government Services"
              active
              onClick={() => navigate("/services")}
            />

            <SidebarItem
              icon="✓"
              label="Eligible Services"
              onClick={() => navigate("/eligibility")}
            />

            <SidebarItem
              icon="✦"
              label="AI Recommendations"
              onClick={() => navigate("/recommendation")}
            />

            <SidebarItem
              icon="▧"
              label="Documents"
              onClick={() => navigate("/documents")}
            />

            <SidebarItem
              icon="◉"
              label="Notifications"
              onClick={() => {}}
            />
          </div>

          <p className="px-3 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Account
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="⚙"
              label="Profile"
              onClick={() => navigate("/profile")}
            />

            <SidebarItem
              icon="↪"
              label="Logout"
              onClick={() => {
                localStorage.removeItem("user_id");
                localStorage.removeItem("user_name");
                navigate("/login");
              }}
            />
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="lg:ml-64">

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Back */}
          <button
            onClick={() => navigate("/services")}
            className="mb-6 text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Government Services
          </button>

          {/* Header */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-indigo-400">
              GOVERNMENT SERVICE
            </p>

            <h1 className="text-3xl font-bold text-white">
              {service.service_name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-3">

              {service.service_type && (
                <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-300">
                  {service.service_type}
                </span>
              )}

              {service.department && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                  {service.department}
                </span>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ================= LEFT ================= */}
            <div className="space-y-6 lg:col-span-2">

              {/* Description */}
              <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6">
                <h2 className="text-lg font-semibold text-white">
                  About This Service
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                  {service.description ||
                    "No description available for this service."}
                </p>
              </section>

              {/* Eligibility */}
              <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6">
                <h2 className="text-lg font-semibold text-white">
                  Eligibility
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-400">
                  {service.eligibility ||
                    "Eligibility information is not available."}
                </p>
              </section>

              {/* ================= REQUIRED DOCUMENTS ================= */}
              <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Required Documents
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Documents needed to apply for this service.
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                    {documents.length} document
                    {documents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {documents.length > 0 ? (
                  <div className="mt-5 space-y-3">

                    {documents.map((document, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                          ✓
                        </div>

                        <span className="text-sm text-slate-300">
                          {document}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
                    Required document information is not available.
                  </div>
                )}

                {/* Verification button */}
                <div className="mt-6 border-t border-white/10 pt-5">

                  <p className="mb-3 text-sm text-slate-400">
                    Already have these documents? Upload them and
                    check their verification status.
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/documents?service_id=${serviceId}`)
                    }
                    className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Verify / Upload Documents →
                  </button>
                </div>
              </section>
            </div>

            {/* ================= RIGHT ================= */}
            <div className="space-y-6">

              {/* Service information */}
              <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6">
                <h2 className="text-lg font-semibold text-white">
                  Service Information
                </h2>

                <div className="mt-5 space-y-4">

                  <InfoRow
                    label="State"
                    value={service.state || "All States"}
                  />

                  <InfoRow
                    label="Category"
                    value={service.category || "Any"}
                  />

                  <InfoRow
                    label="Occupation"
                    value={service.occupation || "Any"}
                  />

                  <InfoRow
                    label="Age"
                    value={
                      service.age_min !== null &&
                      service.age_min !== undefined &&
                      service.age_max !== null &&
                      service.age_max !== undefined
                        ? `${service.age_min} - ${service.age_max} years`
                        : "Not specified"
                    }
                  />

                  <InfoRow
                    label="Income Limit"
                    value={
                      service.income_limit
                        ? `₹${Number(
                            service.income_limit
                          ).toLocaleString("en-IN")}`
                        : "Not specified"
                    }
                  />
                </div>
              </section>

              {/* Application */}
              <section className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6">

                <h2 className="text-lg font-semibold text-white">
                  Apply for this Service
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Use the official government portal to submit your
                  application.
                </p>

                {service.application_link ? (
                  <a
                    href={service.application_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 block rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Open Official Application →
                  </a>
                ) : (
                  <div className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-center text-sm text-slate-500">
                    Application link unavailable
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
        active
          ? "bg-indigo-500/10 text-indigo-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="w-5 text-center text-base">
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm text-slate-300">
        {value}
      </span>
    </div>
  );
}

export default ServiceDetails;