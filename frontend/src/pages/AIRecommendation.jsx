import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AIRecommendation() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const [requirement, setRequirement] = useState("");

  const [recommendations, setRecommendations] = useState([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "Citizen";

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
      setError(err.message || "Unable to load your profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const getAIRecommendation = async () => {
    if (!requirement.trim()) {
      setError("Please describe what government service you need.");
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

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to generate recommendation."
        );
      }

      /*
        Expected backend response:

        {
          status: "success",
          recommendations: [...]
        }

        Also safely handles:
        recommendations: [...]
        or
        data: [...]
      */

      let result = [];

      if (Array.isArray(data)) {
        result = data;
      } else if (Array.isArray(data.recommendations)) {
        result = data.recommendations;
      } else if (Array.isArray(data.data)) {
        result = data.data;
      }

      setRecommendations(result);
      setSubmitted(true);

    } catch (err) {
      setError(
        err.message || "Unable to generate AI recommendation."
      );
    } finally {
      setLoadingRecommendation(false);
    }
  };

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
              active
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

        {/* Quick Action */}
        <div className="border-t border-white/10 p-4">

          <button
            onClick={() => navigate("/eligibility")}
            className="w-full rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition duration-300 hover:bg-emerald-400/15"
          >
            Check Eligibility
          </button>

        </div>

      </aside>

      {/* ================= MAIN ================= */}
      <div className="min-h-screen lg:ml-64">

        {/* Top Bar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1422]/90 backdrop-blur-xl">

          <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                AI Assistance
              </p>

              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                Personalized Government Service Recommendation
              </h1>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                  {userName}
                </p>

                <p className="text-[11px] text-emerald-400">
                  ● Verified
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>

            </div>

          </div>

        </header>

        {/* ================= CONTENT ================= */}
        <main className="px-6 py-8 lg:px-8">

          {/* Introduction */}
          <section className="mb-8">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-300">
                ✦
              </div>

              <div>

                <h2 className="text-3xl font-bold text-slate-100">
                  AI Recommendation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tell us what you need and discover the most relevant
                  government service.
                </p>

              </div>

            </div>

          </section>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">

            {/* ================= PROFILE SUMMARY ================= */}
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
                    Used for personalized recommendation
                  </p>
                </div>

              </div>

              {loadingProfile ? (
                <div className="mt-6 space-y-3">
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
              ) : null}

            </section>

            {/* ================= AI INPUT ================= */}
            <section className="rounded-2xl border border-indigo-400/15 bg-[#141d2e] p-6 shadow-xl lg:p-8">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                  Requirement Analysis
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-slate-100">
                  What government service do you need?
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Describe your requirement in your own words. The AI
                  will analyse the available government services and
                  identify the most relevant option.
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
                  rows={6}
                  value={requirement}
                  onChange={(e) => {
                    setRequirement(e.target.value);
                    setError("");
                  }}
                  placeholder="Example: I am a student from Kerala and I need financial assistance for my higher education. Which government service is most relevant to me?"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#25334c] px-4 py-4 text-sm leading-6 text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Describe your actual need rather than asking a general
                  question.
                </p>

              </div>

              {/* Action */}
              <button
                onClick={getAIRecommendation}
                disabled={
                  loadingRecommendation ||
                  loadingProfile ||
                  !requirement.trim()
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >

                <span>
                  {loadingRecommendation ? "⏳" : "✦"}
                </span>

                {loadingRecommendation
                  ? "Generating Recommendation..."
                  : "Get AI Recommendation"}

              </button>

              {/* AI Explanation */}
              <div className="mt-6 rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-4">

                <div className="flex items-start gap-3">

                  <span className="mt-0.5 text-indigo-400">
                    ✦
                  </span>

                  <div>

                    <p className="text-xs font-semibold text-indigo-300">
                      How AI Recommendation Works
                    </p>

                   <p className="mt-1 text-xs leading-5 text-slate-500">
                     Your profile and stated requirement are analysed to
                     identify the most relevant government service.
                     This is a recommendation function, not the
                     eligibility decision itself.
                    </p>

                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* ================= RESULTS ================= */}
          {submitted && (
            <section className="mt-8">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                    AI Results
                  </p>

                  <h3 className="mt-1 text-2xl font-semibold">
                    Recommended Services
                  </h3>

                </div>

                {recommendations.length > 0 && (
                  <span className="rounded-full bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                    {recommendations.length} match
                    {recommendations.length !== 1 ? "es" : ""}
                  </span>
                )}

              </div>

              {recommendations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-xl text-amber-300">
                    ?
                  </div>

                  <h4 className="mt-5 text-lg font-semibold">
                    No recommendation found
                  </h4>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                   Try describing your requirement in more detail or
                    using a more specific request.
                  </p>

                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">

                  {recommendations.map((item, index) => (
                    <RecommendationCard
                      key={index}
                      recommendation={item}
                    />
                  ))}

                </div>
              )}

            </section>
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


/* =========================================================
   SIDEBAR
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
   PROFILE SKELETON
   ========================================================= */

function ProfileSkeleton() {
  return (
    <div className="h-12 animate-pulse rounded-xl bg-white/5" />
  );
}


/* =========================================================
   RECOMMENDATION CARD
   ========================================================= */

function RecommendationCard({ recommendation }) {
  const serviceName =
    recommendation.service_name ||
    recommendation.name ||
    recommendation.title ||
    "Recommended Government Service";

  const reason =
    recommendation.reason ||
    recommendation.why_relevant ||
    recommendation.explanation ||
    "";

  const benefits =
    recommendation.benefits ||
    recommendation.benefit ||
    "";

  const documents =
    recommendation.required_documents ||
    recommendation.documents ||
    "";

  const application =
    recommendation.application_procedure ||
    recommendation.how_to_apply ||
    recommendation.application_guidance ||
    "";

  const applicationLink =
    recommendation.application_link ||
    recommendation.application_url ||
    "";

  return (
    <div className="group rounded-2xl border border-indigo-400/15 bg-[#141d2e] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-950/20">

      {/* Header */}
      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-xl text-indigo-300 transition-transform duration-300 group-hover:scale-105">
          ✦
        </div>

        <div className="flex-1">

          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
            AI Recommended
          </span>

          <h4 className="mt-1 text-xl font-semibold text-slate-100">
            {serviceName}
          </h4>

        </div>

      </div>

      {/* Reason */}
      {reason && (
        <InfoBlock
          title="Why It Is Relevant"
          content={reason}
        />
      )}

      {/* Benefits */}
      {benefits && (
        <InfoBlock
          title="Benefits"
          content={benefits}
        />
      )}

      {/* Documents */}
      {documents && (
        <InfoBlock
          title="Required Documents"
          content={
            Array.isArray(documents)
              ? documents.join(", ")
              : documents
          }
        />
      )}

      {/* Application */}
      {application && (
        <InfoBlock
          title="How to Apply"
          content={application}
        />
      )}

      {/* Official Link */}
      {applicationLink && (
        <a
          href={applicationLink}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-xl bg-indigo-500 px-5 py-3 text-xs font-semibold text-white transition duration-300 hover:bg-indigo-400"
        >
          Visit Official Application Site →
        </a>
      )}

    </div>
  );
}


/* =========================================================
   INFO BLOCK
   ========================================================= */

function InfoBlock({ title, content }) {
  return (
    <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
        {title}
      </p>

      <div className="mt-2 text-sm leading-6 text-slate-400">
        {Array.isArray(content)
          ? content.join(", ")
          : String(content)}
      </div>

    </div>
  );
}


/* =========================================================
   AGE
   ========================================================= */

function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export default AIRecommendation;