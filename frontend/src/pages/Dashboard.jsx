import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const userName = localStorage.getItem("user_name") || "Citizen";

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

        {/* Menu */}
        <div className="flex-1 px-4 py-6">

          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="▦"
              label="Overview"
              active
              onClick={() => navigate("/dashboard")}
            />

            <SidebarItem
              icon="⌕"
              label="Government Services"
              onClick={() => navigate("/services")}
            />

            <SidebarItem
              icon="✓"
              label="Eligible Services"
              onClick={() => navigate("/recommend")}
            />

            <SidebarItem
              icon="✦"
              label="AI Recommendations"
              onClick={() => navigate("/recommend")}
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
            onClick={() => navigate("/recommend")}
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            + Quick Action
          </button>
        </div>

      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="lg:ml-64">

        {/* ================= TOPBAR ================= */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1422]/90 backdrop-blur-xl">

          <div className="flex h-20 items-center justify-between px-6 lg:px-8">

            {/* Search */}
            <div className="hidden w-[420px] md:block">

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">

                <span className="text-slate-500">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search services, documents..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />

              </div>

            </div>

            {/* Navigation */}
            <div className="ml-auto flex items-center gap-3">

              <TopButton
                label="Overview"
                active
              />

              <TopButton label="Notifications" />

              <TopButton label="Help" />

              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
              >
                🔔
              </button>

              <div className="ml-2 flex items-center gap-3 border-l border-white/10 pl-4">

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

          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <main className="px-6 py-8 lg:px-8">

          {/* Greeting */}
          <section className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Overview
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-100">
                Good morning, {userName}.
              </h1>

              <p className="mt-2 text-base text-slate-400">
                Your digital citizenship at a glance.
              </p>
            </div>

            <Link
              to="/profile"
              className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition duration-300 hover:bg-white/[0.08]"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {userName}
                </p>

                <p className="text-[11px] text-emerald-400">
                  ● Profile Verified
                </p>
              </div>

              <span className="ml-3 text-xs text-slate-400">
                View Profile
              </span>

            </Link>

          </section>

          {/* ================= SUMMARY CARDS ================= */}
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon="✓"
              title="Eligible Services"
              value="10"
              subtitle="Government services"
              accent="emerald"
            />

            <StatCard
              icon="✦"
              title="AI Recommendations"
              value="3"
              subtitle="Relevant matches"
              accent="indigo"
            />

            <StatCard
              icon="▧"
              title="Required Documents"
              value="8"
              subtitle="Documents identified"
              accent="purple"
            />

            <StatCard
              icon="●"
              title="Profile Status"
              value="100%"
              subtitle="Profile complete"
              accent="cyan"
            />

          </section>

          {/* ================= SMART SUGGESTIONS ================= */}
          <section className="mt-7 rounded-2xl border border-white/10 bg-[#141d2e] p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <div className="flex items-center gap-2">

                  <span className="text-indigo-400">
                    ✨
                  </span>

                  <h2 className="text-lg font-semibold">
                    Smart Suggestions
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Personalized suggestions based on your profile.
                </p>
              </div>

              <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View All →
              </button>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <SuggestionCard
                icon="◷"
                title="Check Your Eligible Services"
                text="Review government services that match your current profile."
                action="Check Eligibility →"
                color="amber"
                onClick={() => navigate("/recommend")}
              />

              <SuggestionCard
                icon="✦"
                title="Get Personalized Assistance"
                text="Describe your requirement and receive an AI-powered recommendation."
                action="Get Recommendation →"
                color="indigo"
                onClick={() => navigate("/recommend")}
              />

            </div>

          </section>

          {/* ================= MAIN DASHBOARD CARDS ================= */}
          <section className="mt-7 grid gap-6 xl:grid-cols-2">

            {/* Eligibility Card */}
            <div className="rounded-2xl border border-white/10 bg-[#141d2e] p-6 shadow-xl">

              <div className="flex items-start justify-between">

                <div>
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-400">
                      ✓
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Eligibility Checking
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Find government services you may qualify for.
                      </p>
                    </div>

                  </div>
                </div>

                <button
                  onClick={() => navigate("/recommend")}
                  className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Check Now →
                </button>

              </div>

              <div className="mt-6 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-5">

                <p className="text-sm text-slate-300">
                  Your profile can be used to evaluate government
                  services based on:
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    Age
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    Income
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    Occupation
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    State
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    Category
                  </span>

                </div>

              </div>

            </div>

            {/* Citizen Assistant */}
            <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 shadow-xl">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-xl">
                  ✨
                </div>

                <div>
                  <h2 className="font-semibold">
                    Citizen Assistant
                  </h2>

                  <p className="text-xs text-emerald-400">
                    ● Online & Secure
                  </p>
                </div>

              </div>

              <div className="mt-6 rounded-xl bg-black/20 p-5">

                <p className="text-sm leading-6 text-slate-300">
                  Need help finding a government service?
                </p>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Describe your requirement and get personalized
                  recommendations based on your profile and eligibility.
                </p>

              </div>

              <button
                onClick={() => navigate("/recommend")}
                className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold transition duration-300 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                Ask Assistant
              </button>

            </div>

          </section>

          {/* ================= QUICK ACCESS ================= */}
          <section className="mt-7">

            <h2 className="mb-4 text-lg font-semibold">
              Quick Access
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <QuickCard
                icon="✓"
                title="Check Eligibility"
                text="Find services you qualify for."
                onClick={() => navigate("/recommend")}
              />

              <QuickCard
                icon="✦"
                title="AI Recommendation"
                text="Get personalized service suggestions."
                onClick={() => navigate("/recommend")}
              />

              <QuickCard
                icon="▧"
                title="Documents"
                text="View required documents."
                onClick={() => {}}
              />

              <QuickCard
                icon="👤"
                title="My Profile"
                text="Update your personal information."
                onClick={() => navigate("/profile")}
              />

            </div>

          </section>

        </main>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-600 lg:px-8">

          AI-Powered Citizen Assistance Platform for E-Governance

          <span className="mx-2">
            •
          </span>

          Privacy

          <span className="mx-2">
            •
          </span>

          Accessibility

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
          ? "border-l-2 border-emerald-400 bg-emerald-400/10 text-emerald-300"
          : danger
          ? "text-red-400 hover:bg-red-400/10"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="w-5 text-center text-sm">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </button>
  );
}


/* ================= TOP BUTTON ================= */

function TopButton({
  label,
  active = false,
}) {
  return (
    <button
      className={`hidden px-3 py-2 text-xs transition sm:block ${
        active
          ? "text-emerald-400"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}


/* ================= STAT CARD ================= */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  accent,
}) {
  const styles = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    indigo: "text-indigo-400 bg-indigo-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    cyan: "text-cyan-400 bg-cyan-400/10",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141d2e] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[accent]} transition duration-300 group-hover:scale-110`}
      >
        {icon}
      </div>

      <p className="mt-5 text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold text-slate-100">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>

    </div>
  );
}


/* ================= SUGGESTION CARD ================= */

function SuggestionCard({
  icon,
  title,
  text,
  action,
  color,
  onClick,
}) {
  const colors = {
    amber: "border-amber-400/10 bg-amber-400/5",
    indigo: "border-indigo-400/10 bg-indigo-400/5",
  };

  const textColors = {
    amber: "text-amber-300",
    indigo: "text-indigo-300",
  };

  return (
    <div
      className={`rounded-xl border p-5 ${colors[color]} transition duration-300 hover:-translate-y-1 hover:bg-opacity-10`}
    >

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/10">
          {icon}
        </div>

        <div className="flex-1">

          <h3 className="text-sm font-semibold text-slate-200">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {text}
          </p>

          <button
            onClick={onClick}
            className={`mt-3 text-xs font-semibold ${textColors[color]} transition hover:underline`}
          >
            {action}
          </button>

        </div>

      </div>

    </div>
  );
}


/* ================= QUICK ACCESS ================= */

function QuickCard({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-[#141d2e] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-indigo-400/20 hover:bg-[#182237] hover:shadow-xl"
    >

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 transition duration-300 group-hover:scale-110">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-200">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>

    </button>
  );
}


export default Dashboard;