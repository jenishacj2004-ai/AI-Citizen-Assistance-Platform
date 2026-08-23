import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Eligibility() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [userId, navigate]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/profile/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to fetch your profile."
        );
      }

      setProfile(data);
    } catch (err) {
      setError(err.message || "Unable to fetch profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const checkEligibility = async () => {
    try {
      setChecking(true);
      setError("");
      setChecked(false);
      setServices([]);

      const response = await fetch(
        `http://127.0.0.1:8000/eligible-services/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to check eligibility."
        );
      }

      // Handles either:
      // [...] 
      // or { eligible_services: [...] }
      // or { services: [...] }
      const result =
        Array.isArray(data)
          ? data
          : data.eligible_services ||
            data.services ||
            [];

      setServices(result);
      setChecked(true);
    } catch (err) {
      setError(
        err.message || "Unable to check eligible services."
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-white">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-[#0b101b] lg:flex lg:flex-col">

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
              onClick={() => navigate("/services")}
            />

            <SidebarItem
              icon="✓"
              label="Eligibility Checking"
              active
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

        <div className="border-t border-white/10 p-4">
          <button
            onClick={checkEligibility}
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            Check Eligibility
          </button>
        </div>

      </aside>

      {/* ================= MAIN ================= */}
      <div className="min-h-screen lg:ml-64">

        {/* TOP BAR */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1422]/90 backdrop-blur-xl">

          <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Eligibility
              </p>

              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                Check Government Service Eligibility
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

        {/* PAGE CONTENT */}
        <main className="px-6 py-8 lg:px-8">

          {/* Intro */}
          <section className="mb-8">

            <h2 className="text-3xl font-bold text-slate-100">
              Find services you may be eligible for
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Your profile information is evaluated against the
              predefined eligibility conditions of available government
              services. No AI recommendation is used in this process.
            </p>

          </section>

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[350px_1fr]">

            {/* ================= PROFILE CARD ================= */}
            <section className="rounded-2xl border border-white/10 bg-[#141d2e] p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  👤
                </div>

                <div>
                  <h3 className="font-semibold">
                    Your Profile
                  </h3>

                  <p className="text-xs text-slate-500">
                    Used for eligibility evaluation
                  </p>
                </div>

              </div>

              {loadingProfile ? (
                <div className="mt-8 space-y-3">

                  <div className="h-10 animate-pulse rounded-lg bg-white/5" />
                  <div className="h-10 animate-pulse rounded-lg bg-white/5" />
                  <div className="h-10 animate-pulse rounded-lg bg-white/5" />
                  <div className="h-10 animate-pulse rounded-lg bg-white/5" />

                </div>
              ) : profile ? (
                <div className="mt-6 space-y-3">

                  <ProfileRow
                    label="Name"
                    value={profile.full_name}
                  />

                  <ProfileRow
                    label="Date of Birth"
                    value={profile.dob}
                  />

                  <ProfileRow
                    label="Category"
                    value={profile.category}
                  />

                  <ProfileRow
                    label="Occupation"
                    value={profile.occupation}
                  />

                  <ProfileRow
                    label="Annual Income"
                    value={
                      profile.annual_income !== null &&
                      profile.annual_income !== undefined
                        ? `₹${Number(
                            profile.annual_income
                          ).toLocaleString("en-IN")}`
                        : "Not provided"
                    }
                  />

                  <ProfileRow
                    label="State"
                    value={profile.state}
                  />

                  <ProfileRow
                    label="District"
                    value={profile.district}
                  />

                  <Link
                    to="/profile"
                    className="mt-4 block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Update Profile
                  </Link>

                </div>
              ) : null}

            </section>

            {/* ================= RESULT AREA ================= */}
            <section className="rounded-2xl border border-white/10 bg-[#141d2e] p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-xl font-semibold">
                    Eligible Government Services
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Services matching your current profile.
                  </p>

                </div>

                <button
                  onClick={checkEligibility}
                  disabled={checking || loadingProfile}
                  className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking
                    ? "Checking..."
                    : "Check My Eligibility"}
                </button>

              </div>

              {/* INITIAL STATE */}
              {!checked && !checking && (
                <div className="mt-8 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl text-emerald-400">
                    ✓
                  </div>

                  <h4 className="mt-5 text-lg font-semibold">
                    Ready to check eligibility
                  </h4>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Click the button above to compare your profile
                    with the eligibility conditions of available
                    government services.
                  </p>

                </div>
              )}

              {/* LOADING */}
              {checking && (
                <div className="mt-8 space-y-4">

                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />

                </div>
              )}

              {/* NO RESULTS */}
              {checked && !checking && services.length === 0 && (
                <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-xl text-amber-300">
                    !
                  </div>

                  <h4 className="mt-5 text-lg font-semibold">
                    No eligible services found
                  </h4>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Try updating your profile information or check
                    the available services for more options.
                  </p>

                </div>
              )}

              {/* SERVICES */}
              {checked && !checking && services.length > 0 && (
                <div className="mt-8 space-y-4">

                  <div className="mb-4 flex items-center justify-between">

                    <span className="text-sm text-slate-400">
                      {services.length} eligible service
                      {services.length !== 1 ? "s" : ""} found
                    </span>

                    <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                      Eligibility Checked
                    </span>

                  </div>

                  {services.map((service, index) => (
                    <ServiceCard
                      key={
                        service.service_id ||
                        service.id ||
                        index
                      }
                      service={service}
                    />
                  ))}

                </div>
              )}

            </section>

          </div>

        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-600 lg:px-8">
          AI-Powered Citizen Assistance Platform for E-Governance
        </footer>

      </div>
    </div>
  );
}


/* =========================================================
   SIDEBAR ITEM
   ========================================================= */

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
          ? "border-l-2 border-emerald-400 bg-emerald-400/10 text-emerald-300"
          : danger
          ? "text-red-400 hover:bg-red-400/10"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="w-5 text-center text-sm">
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}


/* =========================================================
   PROFILE ROW
   ========================================================= */

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">

      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-300">
        {value || "Not provided"}
      </p>

    </div>
  );
}


/* =========================================================
   LOADING CARD
   ========================================================= */

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="h-4 w-1/3 rounded bg-white/10" />

      <div className="mt-3 h-3 w-2/3 rounded bg-white/5" />

      <div className="mt-5 h-10 w-full rounded bg-white/5" />

    </div>
  );
}


/* =========================================================
   SERVICE CARD
   ========================================================= */

function ServiceCard({ service }) {
  const serviceName =
    service.service_name ||
    service.name ||
    "Government Service";

  const department =
    service.department ||
    "Government Department";

  const description =
    service.description ||
    "No description available.";

  const requiredDocuments =
    service.required_documents ||
    service.documents ||
    "";

  const applicationLink =
    service.application_link ||
    service.application_url ||
    "";

  const serviceType =
    service.service_type ||
    service.category ||
    "Service";

  return (
    <div className="group rounded-2xl border border-white/10 bg-[#101827] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:bg-[#142033] hover:shadow-xl">

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-xl text-emerald-400 transition duration-300 group-hover:scale-105">
          ✓
        </div>

        {/* Content */}
        <div className="flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h4 className="text-lg font-semibold text-slate-100">
              {serviceName}
            </h4>

            <span className="rounded-full bg-indigo-400/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-300">
              {serviceType}
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            {department}
          </p>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            {description}
          </p>

          {requiredDocuments && (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">

              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Required Documents
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {Array.isArray(requiredDocuments)
                  ? requiredDocuments.join(", ")
                  : requiredDocuments}
              </p>

            </div>
          )}

          {applicationLink && (
            <a
              href={applicationLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400"
            >
              Apply / View Official Site →
            </a>
          )}

        </div>

        {/* Status */}
        <div className="shrink-0">

          <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
            Eligible
          </span>

        </div>

      </div>

    </div>
  );
}

export default Eligibility;