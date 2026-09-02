import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function GovernmentServices() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/government-services"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load government services."
        );
      }

      setServices(data.services || []);
    } catch (err) {
      setError(
        err.message || "Unable to load government services."
      );
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------
     Get available service types
  -------------------------------- */
  const serviceTypes = useMemo(() => {
    const types = services
      .map((service) => service.service_type)
      .filter(Boolean);

    return ["All", ...new Set(types)];
  }, [services]);

  /* --------------------------------
     Search + Filter
  -------------------------------- */
  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesType =
        selectedType === "All" ||
        service.service_type === selectedType;

      const matchesSearch =
        !query ||
        service.service_name?.toLowerCase().includes(query) ||
        service.department?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.service_type?.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [services, search, selectedType]);

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-white">

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

        {/* Navigation */}
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
              label="Eligibility Checking"
              onClick={() => navigate("/eligibility")}
            />

            <SidebarItem
              icon="✦"
              label="AI Recommendation"
              onClick={() => navigate("/recommendation")}
            />

            <SidebarItem
              icon="▧"
              label="Documents"
              onClick={() => {}}
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
              icon="👤"
              label="Profile"
              onClick={() => navigate("/profile")}
            />

            <SidebarItem
              icon="⚙"
              label="Settings"
              onClick={() => {}}
            />

            <SidebarItem
              icon="↪"
              label="Logout"
              danger
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            />

          </div>

        </div>

      </aside>

      {/* ================= MAIN ================= */}
      <div className="min-h-screen lg:ml-64">

        {/* Top Bar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1422]/90 backdrop-blur-xl">

          <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Government Services
              </p>

              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                Explore Government Services
              </h1>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                  {localStorage.getItem("user_name") || "Citizen"}
                </p>

                <p className="text-[11px] text-emerald-400">
                  ● Verified
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold">
                {(localStorage.getItem("user_name") || "C")
                  .charAt(0)
                  .toUpperCase()}
              </div>

            </div>

          </div>

        </header>

        {/* Content */}
        <main className="px-6 py-8 lg:px-8">

          {/* Introduction */}
          <section className="mb-8">

            <h2 className="text-3xl font-bold text-slate-100">
              Find Government Services
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Search and explore government schemes, certificates,
              and citizen services available through the platform.
            </p>

          </section>

          {/* ================= SEARCH ================= */}
          <section className="rounded-2xl border border-white/10 bg-[#141d2e] p-5">

            <label
              htmlFor="serviceSearch"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Search Services
            </label>

            <div className="relative">

              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                ⌕
              </span>

              <input
                id="serviceSearch"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search service name, department, or description..."
                className="w-full rounded-xl border border-white/10 bg-[#25334c] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />

            </div>

            {/* Service type filters */}
            <div className="mt-5">

              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Service Type
              </p>

              <div className="flex flex-wrap gap-2">

                {serviceTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition duration-300 ${
                      selectedType === type
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                        : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}

              </div>

            </div>

            {/* Result count */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">

              <p className="text-xs text-slate-600">
                Showing {filteredServices.length} of {services.length} services
              </p>

              {(search || selectedType !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedType("All");
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </section>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />

            </div>
          ) : filteredServices.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-xl text-amber-300">
                ?
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No services found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search term or select a different service type.
              </p>

            </div>
          ) : (
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.service_id}
                  service={service}
                  onClick={() =>
                    navigate(`/services/${service.service_id}`)
                  }
                />
              ))}

            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-600 lg:px-8">
          AI-Powered Citizen Assistance Platform for E-Governance
        </footer>

      </div>
    </div>
  );
}


/* ================= SIDEBAR ITEM ================= */

function SidebarItem({
  icon,
  label,
  active = false,
  danger = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition duration-300 ${
        active
          ? "border-l-2 border-indigo-400 bg-indigo-400/10 text-indigo-300"
          : danger
          ? "text-red-400 hover:bg-red-400/10"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="w-5 text-center">
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}


/* ================= SERVICE CARD ================= */

function ServiceCard({ service, onClick }) {
  const isCertificate =
    service.service_type?.toLowerCase() === "certificate";

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-[#141d2e] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/25 hover:bg-[#182237] hover:shadow-xl"
    >

      {/* Top */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-xl text-indigo-300 transition duration-300 group-hover:scale-105">
          {isCertificate ? "📄" : "✦"}
        </div>

        <span className="rounded-full bg-indigo-400/10 px-3 py-1.5 text-[10px] font-semibold text-indigo-300">
          {service.service_type || "Service"}
        </span>

      </div>

      {/* Name */}
      <h3 className="mt-5 text-lg font-semibold text-slate-100">
        {service.service_name}
      </h3>

      {/* Department */}
      <p className="mt-1 text-xs text-slate-500">
        {service.department}
      </p>

      {/* Description */}
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
        {service.description}
      </p>

      {/* Bottom */}
      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

        <span className="text-xs text-slate-600">
          View service details
        </span>

        <span className="text-sm font-semibold text-indigo-400 transition group-hover:translate-x-1">
          →
        </span>

      </div>

    </div>
  );
}


/* ================= LOADING CARD ================= */

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-[#141d2e] p-6">

      <div className="h-12 w-12 rounded-xl bg-white/5" />

      <div className="mt-5 h-5 w-3/4 rounded bg-white/5" />

      <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />

      <div className="mt-5 h-12 w-full rounded bg-white/5" />

      <div className="mt-5 h-3 w-1/3 rounded bg-white/5" />

    </div>
  );
}

export default GovernmentServices;