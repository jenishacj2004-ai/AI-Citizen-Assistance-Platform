import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AIRecommendation() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [profile, setProfile] = useState(null);
  const [requirement, setRequirement] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRecommendation, setLoadingRecommendation] =
    useState(false);

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // =========================================================
  // LOCAL STORAGE
  // =========================================================

  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "Citizen";

  // =========================================================
  // LOAD PROFILE
  // =========================================================

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

      console.log("Profile:", data);

      setProfile(data);
    } catch (err) {
      console.error("Profile Error:", err);

      setError(
        err.message || "Unable to load your profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // =========================================================
  // GET AI RECOMMENDATION
  // =========================================================

  const getAIRecommendation = async () => {
    if (!requirement.trim()) {
      setError(
        "Please describe what government service or assistance you need."
      );
      return;
    }

    try {
      setLoadingRecommendation(true);
      setError("");
      setSubmitted(false);
      setRecommendations([]);

      const response = await fetch(
        "http://127.0.0.1:8000/recommend-services",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            user_id: Number(userId),
            query: requirement.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log("AI Recommendation Response:", data);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to generate AI recommendation."
        );
      }

      // =====================================================
      // HANDLE BACKEND RESPONSE
      // =====================================================

      let result = [];

      if (Array.isArray(data)) {
        result = data;
      } else if (Array.isArray(data.recommendations)) {
        result = data.recommendations;
      } else if (Array.isArray(data.data)) {
        result = data.data;
      } else if (data.recommendation) {
        result = [data.recommendation];
      }

      console.log("Final Recommendations:", result);

      setRecommendations(result);
      setSubmitted(true);
    } catch (err) {
      console.error("AI Recommendation Error:", err);

      setError(
        err.message ||
          "Unable to generate AI recommendation."
      );
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-white">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="
          fixed left-0 top-0 z-30 hidden h-screen w-64
          border-r border-white/10
          bg-[#0b101b]
          lg:flex lg:flex-col
        "
      >

        {/* Logo */}

        <div className="border-b border-white/10 px-6 py-5">

          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
          >
            Citizen
            <span className="text-indigo-400">
              AI
            </span>
          </Link>

          <p
            className="
              mt-1
              text-[10px]
              uppercase
              tracking-[0.18em]
              text-slate-500
            "
          >
            Digital Citizenship
          </p>

        </div>

        {/* Navigation */}

        <div className="flex-1 px-4 py-6">

          <p
            className="
              px-3
              pb-3
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-slate-500
            "
          >
            Main Menu
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="▦"
              label="Overview"
              onClick={() =>
                navigate("/dashboard")
              }
            />

            <SidebarItem
              icon="⌕"
              label="Government Services"
              onClick={() =>
                navigate("/services")
              }
            />

            <SidebarItem
              icon="✓"
              label="Eligibility Checking"
              onClick={() =>
                navigate("/eligibility")
              }
            />

            <SidebarItem
              icon="✦"
              label="AI Recommendation"
              active
              onClick={() =>
                navigate("/recommendation")
              }
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

          {/* Account */}

          <p
            className="
              px-3
              pb-3
              pt-8
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-slate-500
            "
          >
            Account
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="👤"
              label="Profile"
              onClick={() =>
                navigate("/profile")
              }
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

        {/* Quick Action */}

        <div className="border-t border-white/10 p-4">

          <button
            onClick={() =>
              navigate("/eligibility")
            }
            className="
              w-full
              rounded-xl
              border border-emerald-400/20
              bg-emerald-400/10
              px-4
              py-3
              text-sm
              font-semibold
              text-emerald-300
              transition
              duration-300
              hover:bg-emerald-400/15
            "
          >
            Check Eligibility
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="min-h-screen lg:ml-64">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header
          className="
            sticky
            top-0
            z-20
            border-b border-white/10
            bg-[#0d1422]/90
            backdrop-blur-xl
          "
        >

          <div
            className="
              flex
              min-h-20
              items-center
              justify-between
              px-6
              lg:px-8
            "
          >

            <div>

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-indigo-400
                "
              >
                AI Assistance
              </p>

              <h1
                className="
                  mt-1
                  text-lg
                  font-semibold
                  text-slate-100
                "
              >
                Personalized Government Service Recommendation
              </h1>

            </div>

            <div className="flex items-center gap-3">

              <div
                className="
                  hidden
                  text-right
                  sm:block
                "
              >

                <p className="text-sm font-semibold">
                  {userName}
                </p>

                <p
                  className="
                    text-[11px]
                    text-emerald-400
                  "
                >
                  ● Verified
                </p>

              </div>

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-indigo-500
                  to-purple-500
                  font-bold
                "
              >
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </div>

            </div>

          </div>

        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="px-6 py-8 lg:px-8">

          {/* =================================================
              INTRODUCTION
          ================================================= */}

          <section className="mb-8">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-12 w-12
                  items-center justify-center
                  rounded-2xl
                  bg-indigo-500/10
                  text-2xl
                  text-indigo-300
                "
              >
                ✦
              </div>

              <div>

                <h2 className="text-3xl font-bold text-slate-100">
                  AI Recommendation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Describe your requirement and let AI identify
                  relevant government services and assistance.
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mb-6 rounded-xl
                border border-red-400/20
                bg-red-500/10
                px-5 py-4
                text-sm text-red-300
              "
            >
              {error}
            </div>
          )}

          {/* =================================================
              PROFILE + AI INPUT
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">

            {/* =================================================
                PROFILE SUMMARY
            ================================================= */}

            <section
              className="
                rounded-2xl
                border border-white/10
                bg-[#141d2e]
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-indigo-500/10
                    text-indigo-300
                  "
                >
                  👤
                </div>

                <div>

                  <h3 className="font-semibold">
                    Your Profile
                  </h3>

                  <p className="text-xs text-slate-500">
                    Used by AI for personalized assistance
                  </p>

                </div>

              </div>

              {/* Loading */}

              {loadingProfile ? (

                <div className="mt-6 space-y-3">

                  <ProfileSkeleton />
                  <ProfileSkeleton />
                  <ProfileSkeleton />
                  <ProfileSkeleton />
                  <ProfileSkeleton />

                </div>

              ) : profile ? (

                <div className="mt-6 space-y-3">

                  <ProfileRow
                    label="Name"
                    value={profile.full_name}
                  />

                  <ProfileRow
                    label="Age"
                    value={
                      profile.dob
                        ? calculateAge(profile.dob)
                        : "Not available"
                    }
                  />

                  <ProfileRow
                    label="Occupation"
                    value={profile.occupation}
                  />

                  <ProfileRow
                    label="Category"
                    value={profile.category}
                  />

                  <ProfileRow
                    label="State"
                    value={profile.state}
                  />

                  <ProfileRow
                    label="District"
                    value={profile.district}
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

                </div>

              ) : (

                <div className="mt-6 rounded-xl bg-white/[0.02] p-4 text-sm text-slate-500">
                  Profile information unavailable.
                </div>

              )}

            </section>

            {/* =================================================
                AI INPUT
            ================================================= */}

            <section
              className="
                rounded-2xl
                border border-indigo-400/15
                bg-[#141d2e]
                p-6
                shadow-xl
                lg:p-8
              "
            >

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                  AI Requirement Analysis
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-slate-100">
                  What do you need help with?
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Describe your requirement in your own words.
                  AI will analyse your requirement together with
                  your citizen profile and provide relevant
                  government service information.
                </p>

              </div>

              {/* Requirement */}

              <div className="mt-6">

                <label
                  htmlFor="requirement"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Describe Your Requirement
                </label>

                <textarea
                  id="requirement"
                  rows={7}
                  value={requirement}
                  onChange={(e) => {
                    setRequirement(e.target.value);
                    setError("");
                  }}
                  placeholder="Example: I need an income certificate for applying for a government scholarship. What documents are required and how can I apply?"
                  className="
                    w-full resize-none
                    rounded-2xl
                    border border-white/10
                    bg-[#25334c]
                    px-4 py-4
                    text-sm leading-6
                    text-white
                    outline-none
                    transition duration-300
                    placeholder:text-slate-500
                    focus:border-indigo-400
                    focus:ring-2
                    focus:ring-indigo-400/20
                  "
                />

                <p className="mt-2 text-xs text-slate-600">
                  You can ask about a government service,
                  financial assistance, certificates, documents,
                  eligibility or application procedures.
                </p>

              </div>

              {/* Button */}

              <button
                onClick={getAIRecommendation}
                disabled={
                  loadingRecommendation ||
                  loadingProfile ||
                  !requirement.trim()
                }
                className="
                  mt-6 flex w-full
                  items-center justify-center
                  gap-2
                  rounded-xl
                  bg-indigo-500
                  px-5 py-3.5
                  text-sm font-semibold
                  text-white
                  transition duration-300
                  hover:-translate-y-0.5
                  hover:bg-indigo-400
                  hover:shadow-lg
                  hover:shadow-indigo-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  disabled:hover:translate-y-0
                "
              >

                <span>
                  {loadingRecommendation
                    ? "⏳"
                    : "✦"}
                </span>

                {loadingRecommendation
                  ? "AI is analysing..."
                  : "Get AI Recommendation"}

              </button>

              {/* How AI Works */}

              <div
                className="
                  mt-6 rounded-xl
                  border border-indigo-400/10
                  bg-indigo-400/5
                  p-4
                "
              >

                <div className="flex items-start gap-3">

                  <span className="mt-0.5 text-indigo-400">
                    ✦
                  </span>

                  <div>

                    <p className="text-xs font-semibold text-indigo-300">
                      How AI Assistance Works
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your requirement and profile information
                      are analysed by Gemini AI. The system
                      identifies relevant government services
                      and provides guidance about eligibility,
                      required documents, benefits and
                      application procedures.
                    </p>

                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* =================================================
              RESULTS
          ================================================= */}

          {submitted && (

            <section className="mt-8">

              {/* Results Header */}

              <div
                className="
                  mb-5 flex
                  flex-col gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                    AI Results
                  </p>

                  <h3 className="mt-1 text-2xl font-semibold text-slate-100">
                    Relevant Government Services
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Services identified based on your requirement
                    and profile.
                  </p>

                </div>

                {recommendations.length > 0 && (

                  <span
                    className="
                      w-fit rounded-full
                      border border-indigo-400/10
                      bg-indigo-400/10
                      px-3 py-1.5
                      text-xs font-semibold
                      text-indigo-300
                    "
                  >
                    {recommendations.length} result
                    {recommendations.length !== 1
                      ? "s"
                      : ""}
                  </span>

                )}

              </div>

              {/* No Results */}

              {recommendations.length === 0 ? (

                <div
                  className="
                    rounded-2xl
                    border border-dashed
                    border-white/10
                    bg-white/[0.02]
                    p-10
                    text-center
                  "
                >

                  <div
                    className="
                      mx-auto flex h-14 w-14
                      items-center justify-center
                      rounded-2xl
                      bg-amber-400/10
                      text-xl
                      text-amber-300
                    "
                  >
                    ?
                  </div>

                  <h4 className="mt-5 text-lg font-semibold text-slate-200">
                    No relevant service found
                  </h4>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    Try describing your requirement with more
                    details. Mention the certificate, assistance,
                    scheme or government service you need.
                  </p>

                </div>

              ) : (

                <div
                  className="
                    grid
                    gap-5
                    md:grid-cols-1
                    xl:grid-cols-2
                  "
                >

                  {recommendations.map(
                    (item, index) => (

                      <RecommendationCard
                        key={index}
                        recommendation={item}
                      />

                    )
                  )}

                </div>

              )}

            </section>

          )}

        </main>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer
          className="
            border-t border-white/10
            px-6 py-6
            text-center
            text-xs text-slate-600
            lg:px-8
          "
        >
          AI-Powered Citizen Assistance Platform for E-Governance
        </footer>

      </div>

    </div>
  );
}


// =========================================================
// SIDEBAR ITEM
// =========================================================

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
      className={`
        group flex w-full
        items-center gap-3
        rounded-lg
        px-3 py-3
        text-left text-sm
        transition duration-300

        ${
          active
            ? "border-l-2 border-indigo-400 bg-indigo-400/10 text-indigo-300"
            : danger
            ? "text-red-400 hover:bg-red-400/10"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }
      `}
    >

      <span className="w-5 text-center">
        {icon}
      </span>

      <span>
        {label}
      </span>

    </button>
  );
}


// =========================================================
// PROFILE ROW
// =========================================================

function ProfileRow({
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-xl
        border border-white/5
        bg-white/[0.02]
        px-4 py-3
      "
    >

      <p
        className="
          text-[10px]
          uppercase
          tracking-[0.12em]
          text-slate-600
        "
      >
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-300">
        {value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
          ? String(value)
          : "Not provided"}
      </p>

    </div>
  );
}


// =========================================================
// PROFILE SKELETON
// =========================================================

function ProfileSkeleton() {
  return (
    <div
      className="
        h-12
        animate-pulse
        rounded-xl
        bg-white/5
      "
    />
  );
}
//********************************************************************************************************************************************** */


// =========================================================
// RECOMMENDATION CARD
// =========================================================

function RecommendationCard({ recommendation }) {

  const serviceName =
    recommendation.service_name ||
    recommendation.name ||
    recommendation.title ||
    "Government Service";

  const department =
    recommendation.department ||
    "Government Service";

  const description =
    recommendation.description || "";

  const reason =
    recommendation.reason ||
    recommendation.why_relevant ||
    recommendation.explanation ||
    "";

  const eligibilityStatus =
    recommendation.eligibility_status ||
    recommendation.eligibility_assessment ||
    recommendation.status ||
    "";

  const eligibility =
    recommendation.eligibility ||
    recommendation.eligibility_conditions ||
    [];

  const benefits =
    recommendation.benefits ||
    recommendation.benefit ||
    "";

  const documents =
    recommendation.required_documents ||
    recommendation.documents ||
    [];

  const application =
    recommendation.application_procedure ||
    recommendation.how_to_apply ||
    recommendation.application_guidance ||
    [];

  const applicationLink =
    recommendation.application_link ||
    recommendation.application_url ||
    recommendation.official_application_link ||
    "";

  const officialSourceNote =
    recommendation.official_source_note ||
    "Verify the latest information through the official government source.";

  // =========================================================
  // ELIGIBILITY STYLE
  // =========================================================

  const getEligibilityStyle = (status) => {

    const value = String(status).toLowerCase();

    if (
      value.includes("eligible") &&
      !value.includes("not")
    ) {
      return {
        container: "border-emerald-400/20 bg-emerald-400/10",
        icon: "✓",
        iconBg: "bg-emerald-400/15 text-emerald-300",
        text: "text-emerald-300",
      };
    }

    if (value.includes("potential")) {
      return {
        container: "border-amber-400/20 bg-amber-400/10",
        icon: "?",
        iconBg: "bg-amber-400/15 text-amber-300",
        text: "text-amber-300",
      };
    }

    if (value.includes("not eligible")) {
      return {
        container: "border-red-400/20 bg-red-400/10",
        icon: "!",
        iconBg: "bg-red-400/15 text-red-300",
        text: "text-red-300",
      };
    }

    return {
      container: "border-slate-400/15 bg-slate-400/5",
      icon: "?",
      iconBg: "bg-slate-400/10 text-slate-300",
      text: "text-slate-300",
    };
  };

  const eligibilityStyle =
    getEligibilityStyle(eligibilityStatus);

  return (

    <article
      className="
        group relative overflow-hidden
        rounded-3xl
        border border-white/10
        bg-[#141d2e]
        shadow-lg shadow-black/10
        transition-all duration-300
        hover:-translate-y-1
        hover:border-indigo-400/30
        hover:shadow-2xl
        hover:shadow-indigo-950/30
      "
    >

      {/* =================================================
          TOP ACCENT
      ================================================= */}

      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />

      <div className="p-6 sm:p-7">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start gap-4">

          <div
            className="
              flex h-14 w-14 shrink-0
              items-center justify-center
              rounded-2xl
              bg-indigo-500/10
              text-2xl
              text-indigo-300
              ring-1
              ring-indigo-400/10
              transition
              duration-300
              group-hover:scale-105
            "
          >
            ✦
          </div>

          <div className="min-w-0 flex-1">

            <span
              className="
                inline-flex
                rounded-full
                border
                border-indigo-400/15
                bg-indigo-400/10
                px-2.5
                py-1
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-indigo-300
              "
            >
              AI Recommended
            </span>

            <h4
              className="
                mt-2
                text-xl
                font-bold
                leading-tight
                text-slate-100
                sm:text-2xl
              "
            >
              {serviceName}
            </h4>

            <p className="mt-1 text-xs font-medium text-indigo-300">
              {department}
            </p>

          </div>

        </div>


        {/* =================================================
            DESCRIPTION
        ================================================= */}

        {description && (

          <div className="mt-6">

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              About This Service
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {description}
            </p>

          </div>

        )}


        {/* =================================================
            WHY RELEVANT
        ================================================= */}

        {reason && (

          <div
            className="
              mt-5
              rounded-2xl
              border border-indigo-400/10
              bg-indigo-400/[0.05]
              p-4
            "
          >

            <div className="flex gap-3">

              <div
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-indigo-400/10
                  text-indigo-300
                "
              >
                ✦
              </div>

              <div>

                <p className="text-xs font-semibold text-indigo-300">
                  Why This Service Matches Your Need
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {reason}
                </p>

              </div>

            </div>

          </div>

        )}


        {/* =================================================
            ELIGIBILITY STATUS
        ================================================= */}

        {eligibilityStatus && (

          <div
            className={`
              mt-5
              rounded-2xl
              border
              ${eligibilityStyle.container}
              p-4
            `}
          >

            <div className="flex items-center gap-3">

              <div
                className={`
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-full
                  ${eligibilityStyle.iconBg}
                  font-bold
                `}
              >
                {eligibilityStyle.icon}
              </div>

              <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">
                  Eligibility Assessment
                  </p>

                <div
                  className={`
                      mt-1
                      text-sm
                      font-semibold
                      ${eligibilityStyle.text}
                    `}
                  >
                <SafeContent content={eligibilityStatus} />
                </div>

                </div>

            </div>

          </div>

        )}


        {/* =================================================
            DROPDOWN SECTIONS
        ================================================= */}

        <div className="mt-6 space-y-3">


          {/* ELIGIBILITY */}

          {hasContent(eligibility) && (

            <RecommendationDropdown
              icon="✓"
              title="Eligibility Conditions"
              description="Check the conditions that may apply"
              content={eligibility}
            />

          )}


          {/* BENEFITS */}

          {hasContent(benefits) && (

            <RecommendationDropdown
              icon="★"
              title="Benefits"
              description="What this service or scheme provides"
              content={benefits}
            />

          )}


          {/* DOCUMENTS */}

          {hasContent(documents) && (

            <RecommendationDropdown
              icon="▧"
              title="Documents Required"
              description="Documents you should keep ready"
              content={documents}
              numbered
            />

          )}


          {/* HOW TO APPLY */}

          {hasContent(application) && (

            <RecommendationDropdown
              icon="→"
              title="How to Apply"
              description="Step-by-step application guidance"
              content={application}
              numbered
            />

          )}


          {/* APPLY LINK */}

          {applicationLink && (

            <a
              href={applicationLink}
              target="_blank"
              rel="noreferrer"
              className="
                flex w-full
                items-center justify-between
                rounded-2xl
                border border-indigo-400/20
                bg-indigo-500/10
                px-4 py-4
                transition-all duration-300
                hover:border-indigo-400/40
                hover:bg-indigo-500/15
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-xl
                    bg-indigo-500/15
                    text-indigo-300
                  "
                >
                  ↗
                </div>

                <div>

                  <p className="text-sm font-semibold text-indigo-200">
                    Apply Online
                  </p>

                  <p className="text-xs text-slate-500">
                    Open the official application website
                  </p>

                </div>

              </div>

              <span className="text-indigo-300">
                →
              </span>

            </a>

          )}

        </div>


        {/* =================================================
            IMPORTANT NOTE
        ================================================= */}

        {officialSourceNote && (

          <div
            className="
              mt-6
              rounded-2xl
              border border-amber-400/15
              bg-amber-400/[0.05]
              p-4
            "
          >

            <div className="flex items-start gap-3">

              <div
                className="
                  flex h-8 w-8 shrink-0
                  items-center justify-center
                  rounded-lg
                  bg-amber-400/10
                  text-sm
                  text-amber-300
                "
              >
                !
              </div>

              <div>

                <p className="text-xs font-semibold text-amber-300">
                  Important
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {officialSourceNote}
                </p>

              </div>

            </div>

          </div>

        )}

      </div>

    </article>
  );
}

  
// =========================================================
// RECOMMENDATION DROPDOWN
// =========================================================

function RecommendationDropdown({
  icon,
  title,
  description,
  content,
  numbered = false,
}) {

  const [open, setOpen] = useState(false);

  return (

    <div
      className="
        overflow-hidden
        rounded-2xl
        border border-white/10
        bg-[#0f1727]
        transition-all duration-300
        hover:border-white/15
      "
    >

      {/* =================================================
          DROPDOWN HEADER
      ================================================= */}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          flex w-full
          items-center justify-between
          gap-4
          px-4 py-4
          text-left
          transition-all duration-300
          hover:bg-white/[0.03]
        "
      >

        <div className="flex min-w-0 items-center gap-3">

          {/* Icon */}

          <div
            className="
              flex h-10 w-10
              shrink-0
              items-center justify-center
              rounded-xl
              bg-indigo-500/10
              text-indigo-300
            "
          >
            {icon}
          </div>


          {/* Title */}

          <div className="min-w-0">

            <p className="text-sm font-semibold text-slate-200">
              {title}
            </p>

            {description && (

              <p className="mt-0.5 text-xs text-slate-500">
                {description}
              </p>

            )}

          </div>

        </div>


        {/* Arrow */}

        <span
          className={`
            shrink-0
            text-lg
            text-slate-500
            transition-transform duration-300
            ${open ? "rotate-180 text-indigo-300" : ""}
          `}
        >
          ↓
        </span>

      </button>


      {/* =================================================
          DROPDOWN CONTENT
      ================================================= */}

      {open && (

        <div
          className="
            border-t
            border-white/5
            px-4
            pb-4
            pt-4
          "
        >

          {Array.isArray(content) ? (

            <div className="space-y-2.5">

              {content.map((item, index) => (

                <div
                  key={index}
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border border-white/[0.04]
                    bg-white/[0.02]
                    px-3
                    py-3
                  "
                >

                  {/* Number / check */}

                  <div
                    className={`
                      flex h-6 w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-[11px]
                      font-bold
                      ${
                        numbered
                          ? "bg-indigo-500/10 text-indigo-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }
                    `}
                  >
                    {numbered ? index + 1 : "✓"}
                  </div>


                  {/* Text */}

                  <p className="text-sm leading-6 text-slate-400">
                    {typeof item === "object"
                      ? JSON.stringify(item)
                      : String(item)}
                  </p>

                </div>

              ))}

            </div>

          ) : typeof content === "object" ? (

            <SafeContent content={content} />

          ) : (

            <p className="text-sm leading-6 text-slate-400">
              {String(content)}
            </p>

          )}

        </div>

      )}

    </div>
  );
}
// =========================================================
// RECOMMENDATION SECTION
// =========================================================

function RecommendationSection({
  icon,
  title,
  description,
  content,
  numbered = false,
}) {

  if (!hasContent(content)) {
    return null;
  }

  return (
    <div className="mt-6">

      {/* Section heading */}

      <div className="mb-3 flex items-start gap-3">

        <div
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            bg-white/5
            text-sm
            text-indigo-300
          "
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-sm font-semibold text-slate-200">
            {title}
          </p>

          {description && (
            <p className="mt-0.5 text-xs text-slate-600">
              {description}
            </p>
          )}

        </div>

      </div>

      {/* Content box */}

      <div
        className="
          rounded-2xl
          border border-white/5
          bg-[#0f1727]
          p-4
        "
      >

        {Array.isArray(content) ? (

          <div className="space-y-3">

            {content.map((item, index) => (

              <div
                key={index}
                className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border border-white/[0.04]
                  bg-white/[0.02]
                  px-3 py-3
                "
              >

                {/* Number / check */}

                <div
                  className={`
                    flex h-6 w-6
                    shrink-0
                    items-center justify-center
                    rounded-full
                    text-[11px]
                    font-bold

                    ${
                      numbered
                        ? "bg-indigo-500/10 text-indigo-300"
                        : "bg-emerald-500/10 text-emerald-300"
                    }
                  `}
                >
                  {numbered
                    ? index + 1
                    : "✓"}
                </div>

                <div
                  className="
                    min-w-0
                    flex-1
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  <SafeContent content={item} />
                </div>

              </div>

            ))}

          </div>

        ) : (

          <div
            className="
              text-sm
              leading-6
              text-slate-400
            "
          >
            <SafeContent content={content} />
          </div>

        )}

      </div>

    </div>
  );
};


// =========================================================
// SAFE CONTENT RENDERER

function SafeContent({ content }) {

  // ---------------------------------------------------------
  // NULL / UNDEFINED
  // ---------------------------------------------------------

  if (
    content === null ||
    content === undefined
  ) {
    return null;
  }

  // ---------------------------------------------------------
  // STRING
  // ---------------------------------------------------------

  if (typeof content === "string") {
    return <span>{content}</span>;
  }

  // ---------------------------------------------------------
  // NUMBER
  // ---------------------------------------------------------

  if (typeof content === "number") {
    return <span>{String(content)}</span>;
  }

  // ---------------------------------------------------------
  // BOOLEAN
  // ---------------------------------------------------------

  if (typeof content === "boolean") {
    return <span>{String(content)}</span>;
  }

  // ---------------------------------------------------------
  // ARRAY
  // ---------------------------------------------------------

  if (Array.isArray(content)) {

    return (
      <div className="space-y-2">

        {content.map((item, index) => (

          <div key={index}>

            <SafeContent content={item} />

          </div>

        ))}

      </div>
    );
  }

  // ---------------------------------------------------------
  // OBJECT
  // ---------------------------------------------------------

  if (typeof content === "object") {

    return (
      <div className="space-y-3">

        {Object.entries(content).map(
          ([key, value]) => {

            if (
              value === null ||
              value === undefined ||
              value === ""
            ) {
              return null;
            }

            return (
              <div key={key}>

                <p
                  className="
                    text-xs
                    font-medium
                    capitalize
                    text-slate-500
                  "
                >
                  {formatLabel(key)}
                </p>

                <div className="mt-1 text-sm text-slate-400">
                  <SafeContent content={value} />
                </div>

              </div>
            );
          }
        )}

      </div>
    );
  }

  // ---------------------------------------------------------
  // FALLBACK
  // ---------------------------------------------------------

  return (
    <span>
      {String(content)}
    </span>
  );
}


// =========================================================
// CONTENT CHECK
// =========================================================

function hasContent(value) {

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return String(value).trim().length > 0;
}


// =========================================================
// FORMAT LABEL
// =========================================================

function formatLabel(key) {

  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}


// =========================================================
// CALCULATE AGE
// =========================================================

function calculateAge(dob) {

  const birthDate = new Date(dob);
  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
}


// =========================================================
// EXPORT
// =========================================================

export default AIRecommendation;