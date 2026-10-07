import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Eligibility() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [eligibleServices, setEligibleServices] = useState([]);
  const [informationRequiredServices, setInformationRequiredServices] =
    useState([]);
  const [applicantSpecificServices, setApplicantSpecificServices] = useState(
    []
  );

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    loadEligibilityServices();
  }, [userId, navigate]);

  /*
   * ---------------------------------------------------------
   * LOAD ELIGIBILITY SERVICES
   * ---------------------------------------------------------
   *
   * 1. Get all government services
   * 2. Check each active service
   * 3. Divide services into:
   *    - Eligible
   *    - Information Required
   *    - Applicant Specific
   */

  const loadEligibilityServices = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * STEP 1:
       * Get all government services
       */

      const servicesResponse = await fetch(
        "http://127.0.0.1:8000/government-services"
      );

      const servicesData = await servicesResponse.json();

      if (!servicesResponse.ok) {
        throw new Error(
          servicesData.detail || "Unable to load government services."
        );
      }

      /*
       * Some APIs return:
       *
       * [
       *   {...},
       *   {...}
       * ]
       *
       * Others return:
       *
       * {
       *   services: [...]
       * }
       *
       * Handle both.
       */

      const services = Array.isArray(servicesData)
        ? servicesData
        : servicesData.services || [];

      /*
       * Only active services should be checked.
       */

      const activeServices = services.filter(
        (service) =>
          !service.status ||
          service.status.toLowerCase() === "active"
      );

      const eligible = [];
      const informationRequired = [];
      const applicantSpecific = [];

      /*
       * -------------------------------------------------------
       * STEP 2:
       * Check every service
       * -------------------------------------------------------
       */

      for (const service of activeServices) {
        /*
         * CASE 1: Applicant-Specific Services
         * If applicant_type is not "Self" (e.g. Parent / Guardian, Family Member, etc.)
         * it belongs under Specific Applicant Services.
         */
        const applicantType = (service.applicant_type || "Self").trim().toLowerCase();
        if (applicantType !== "self") {
          applicantSpecific.push(service);
          continue;
        }

        /*
         * CASE 2: Event-Based Services
         * If eligibility_mode is "Event Based" (and applicant_type is "Self"),
         * event-specific information may be required.
         */
        const eligibilityMode = (service.eligibility_mode || "").trim().toLowerCase();
        if (eligibilityMode === "event based") {
          informationRequired.push(service);
          continue;
        }

        /*
         * CASE 3 & CASE 4: Profile-Based or Rule-Based Services
         * Check eligibility using backend rule engine.
         */
        try {
          const eligibilityResponse = await fetch(
            "http://127.0.0.1:8000/eligibility/check",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: Number(userId),
                service_id: service.service_id,
                answers: {},
              }),
            }
          );

          const eligibilityData = await eligibilityResponse.json();

          /*
           * Classify based on backend evaluation result
           */
          if (eligibilityData.status === "ELIGIBLE") {
            eligible.push(service);
          } else if (eligibilityData.status === "INFORMATION REQUIRED") {
            informationRequired.push(service);
          } else if (eligibilityData.status === "APPLICANT SPECIFIC") {
            applicantSpecific.push(service);
          }
          /*
           * Services with status "NOT ELIGIBLE", "UNCONFIGURED", or "NOT APPLICABLE"
           * are safely not displayed.
           */
        } catch (serviceError) {
          console.error(
            `Eligibility check failed for service ${service.service_id}:`,
            serviceError
          );
        }
      }

      /*
       * -------------------------------------------------------
       * STEP 3:
       * Update the three sections
       * -------------------------------------------------------
       */

      setEligibleServices(eligible);
      setInformationRequiredServices(informationRequired);
      setApplicantSpecificServices(applicantSpecific);
    } catch (err) {
      console.error("Eligibility loading error:", err);

      setError(
        err.message ||
          "Unable to load eligibility information."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-white">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-[#0b101b] lg:flex lg:flex-col">

        {/* LOGO */}

        <div className="border-b border-white/10 px-6 py-5">

          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
          >
            Citizen
            <span className="text-indigo-400">AI</span>
          </Link>

          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Digital Citizenship
          </p>

        </div>

        {/* MENU */}

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
              onClick={() => navigate("/documents")}
            />

            <SidebarItem
              icon="◉"
              label="Notifications"
              onClick={() => navigate("/notifications")}
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

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="min-h-screen lg:ml-64">

        {/* TOP BAR */}

        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1422]/90 backdrop-blur-xl">

          <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Eligibility
              </p>

              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                Find Government Services for You
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

        {/* =====================================================
            PAGE CONTENT
        ====================================================== */}

        <main className="px-6 py-8 lg:px-8">

          {/* INTRO */}

          <section className="mb-8">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Personalized Eligibility
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-100">
              Find services you may be eligible for
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Government services are grouped based on your
              eligibility, additional information requirements,
              and applicant type.
            </p>

          </section>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading ? (

            <div className="space-y-6">

              <LoadingSection />
              <LoadingSection />
              <LoadingSection />

            </div>

          ) : (

            <div className="space-y-6">

              {/* =================================================
                  1. ELIGIBLE SERVICES
              ================================================== */}

              <ServiceSection
                title="Services You Can Apply For"
                subtitle="Services that match your current profile and eligibility conditions."
                icon="✓"
                iconStyle="bg-emerald-400/10 text-emerald-400"
                badge={`${eligibleServices.length} Services`}
                badgeStyle="bg-emerald-400/10 text-emerald-300"
              >

                {eligibleServices.length > 0 ? (
                  eligibleServices.map((service) => (
                    <ServiceListItem
                      key={service.service_id}
                      service={service}
                      status="eligible"
                      navigate={navigate}
                    />
                  ))
                ) : (
                  <EmptyMessage>
                    No eligible services were found based on your
                    current profile.
                  </EmptyMessage>
                )}

              </ServiceSection>

              {/* =================================================
                  2. MORE INFORMATION REQUIRED
              ================================================== */}

              <ServiceSection
                title="More Information Required"
                subtitle="Additional information is needed before the system can determine eligibility."
                icon="!"
                iconStyle="bg-amber-400/10 text-amber-300"
                badge={`${informationRequiredServices.length} Services`}
                badgeStyle="bg-amber-400/10 text-amber-300"
              >

                {informationRequiredServices.length > 0 ? (
                  informationRequiredServices.map((service) => (
                    <ServiceListItem
                      key={service.service_id}
                      service={service}
                      status="information"
                      navigate={navigate}
                    />
                  ))
                ) : (
                  <EmptyMessage>
                    No additional information is currently required.
                  </EmptyMessage>
                )}

              </ServiceSection>

              {/* =================================================
                  3. APPLICANT SPECIFIC SERVICES
              ================================================== */}

              <ServiceSection
                title="Specific Applicant Services"
                subtitle="These services may be applied for by a parent, guardian, family member or another authorized person."
                icon="👤"
                iconStyle="bg-indigo-400/10 text-indigo-300"
                badge={`${applicantSpecificServices.length} Services`}
                badgeStyle="bg-indigo-400/10 text-indigo-300"
              >

                {applicantSpecificServices.length > 0 ? (
                  applicantSpecificServices.map((service) => (
                    <ServiceListItem
                      key={service.service_id}
                      service={service}
                      status="applicant"
                      navigate={navigate}
                    />
                  ))
                ) : (
                  <EmptyMessage>
                    No applicant-specific services are currently available.
                  </EmptyMessage>
                )}

              </ServiceSection>

            </div>

          )}

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
   SERVICE SECTION
========================================================= */

function ServiceSection({
  title,
  subtitle,
  icon,
  iconStyle,
  badge,
  badgeStyle,
  children,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141d2e] p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg ${iconStyle}`}
          >
            {icon}
          </div>

          <div>

            <h3 className="text-xl font-semibold text-slate-100">
              {title}
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              {subtitle}
            </p>

          </div>

        </div>

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold ${badgeStyle}`}
        >
          {badge}
        </span>

      </div>

      <div className="mt-6 space-y-3">
        {children}
      </div>

    </section>
  );
}


/* =========================================================
   SERVICE LIST ITEM
========================================================= */

function ServiceListItem({
  service,
  status,
  navigate,
}) {
  let statusText = "";
  let statusStyle = "";
  let buttonText = "";

  if (status === "eligible") {
    statusText = "Eligible";
    statusStyle = "bg-emerald-400/10 text-emerald-300";
    buttonText = "View Service Details →";
  }

  if (status === "information") {
    statusText = "Information Required";
    statusStyle = "bg-amber-400/10 text-amber-300";
    buttonText = "Check Eligibility →";
  }

  if (status === "applicant") {
    statusText = service.applicant_type || "Specific Applicant";
    statusStyle = "bg-indigo-400/10 text-indigo-300";
    buttonText = "View Service Details →";
  }

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-[#101827] p-4 transition duration-300 hover:border-white/20 hover:bg-[#142033] sm:flex-row sm:items-center sm:justify-between">

      {/* SERVICE INFORMATION */}

      <div className="flex min-w-0 items-center gap-4">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
            status === "eligible"
              ? "bg-emerald-400/10 text-emerald-400"
              : status === "information"
              ? "bg-amber-400/10 text-amber-300"
              : "bg-indigo-400/10 text-indigo-300"
          }`}
        >
          {status === "eligible"
            ? "✓"
            : status === "information"
            ? "!"
            : "👤"}
        </div>

        <div className="min-w-0">

          <h4 className="truncate text-sm font-semibold text-slate-100">
            {service.service_name}
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            {service.department}
          </p>

        </div>

      </div>

      {/* STATUS + BUTTON */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold ${statusStyle}`}
        >
          {statusText}
        </span>

        <button
          onClick={() =>
            navigate(`/services/${service.service_id}`)
          }
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {buttonText}
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   EMPTY MESSAGE
========================================================= */

function EmptyMessage({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-6 text-center text-xs text-slate-500">
      {children}
    </div>
  );
}


/* =========================================================
   LOADING SECTION
========================================================= */

function LoadingSection() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-[#141d2e] p-6">

      <div className="h-6 w-64 rounded bg-white/10" />

      <div className="mt-2 h-3 w-96 max-w-full rounded bg-white/5" />

      <div className="mt-6 space-y-3">

        <div className="h-16 rounded-xl bg-white/5" />

        <div className="h-16 rounded-xl bg-white/5" />

      </div>

    </div>
  );
}


export default Eligibility;