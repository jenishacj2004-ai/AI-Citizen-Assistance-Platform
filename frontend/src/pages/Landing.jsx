import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-[#0d1426] text-white">

      {/* ================= NAVBAR ================= */}
      <header className="border-b border-slate-600/40">
        <nav className="mx-auto flex h-[92px] max-w-[1400px] items-center justify-between px-10">

          {/* Logo */}
          <Link
            to="/"
            className="text-[27px] font-bold tracking-tight"
          >
            Citizen<span className="text-[#7180ff]">AI</span>
          </Link>

          {/* Navigation */}
          <div className="hidden items-center gap-8 text-[17px] text-slate-200 md:flex">
            <a
              href="#services"
              className="transition-colors duration-200 hover:text-white"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              className="transition-colors duration-200 hover:text-white"
            >
              How it Works
            </a>

            <a
              href="#features"
              className="transition-colors duration-200 hover:text-white"
            >
              Features
            </a>
          </div>

          {/* Get Started */}
          <Link
            to="/register"
            className="rounded-none bg-[#c2cce8] px-8 py-4 text-[15px] font-semibold text-[#17233a] transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg"
          >
            Get Started
          </Link>

        </nav>
      </header>

      {/* ================= HERO ================= */}
      <main>

        <section className="relative overflow-hidden">

          {/* Background glow */}
          <div className="pointer-events-none absolute left-[5%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />

          <div className="mx-auto flex min-h-[650px] max-w-[1400px] items-center px-10 py-24">

            <div className="relative z-10 max-w-[760px]">

              {/* Small label */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm font-medium text-indigo-300">
                <span>✨</span>
                AI-Powered E-Governance Assistance
              </div>

              {/* Project name */}
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                AI-Powered Citizen Assistance Platform
              </p>

              {/* Main heading */}
              <h1 className="max-w-[750px] text-4xl font-bold leading-[1.1] tracking-tight text-[#c2cce8] sm:text-5xl lg:text-[4rem]">

                Your Digital Bridge to

                <span className="block text-[#7180ff]">
                  Government Services
                </span>

              </h1>

              {/* Description */}
              <p className="mt-7 max-w-[670px] text-lg leading-8 text-[#c5cede]">
                Discover government services that match your profile,
                check your eligibility, and receive personalized
                AI-powered guidance based on your specific requirements.
              </p>

              {/* Buttons */}
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">

                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-3 bg-[#c2cce8] px-8 py-4 text-[15px] font-semibold text-[#17233a] transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                >
                  <span className="text-lg">🤖</span>
                  Launch Assistant
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center border border-slate-500/50 bg-[#182235] px-8 py-4 text-[15px] font-semibold text-[#c6d0e8] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/60 hover:bg-[#202d43]"
                >
                  Sign In
                </Link>

              </div>

              {/* Small trust/info row */}
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">

                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Eligibility Checking
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-indigo-400">✨</span>
                  AI Recommendations
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-teal-400">🔎</span>
                  Service Discovery
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ================= SERVICES ================= */}
        <section
          id="services"
          className="border-t border-slate-600/30 px-10 py-20"
        >
          <div className="mx-auto max-w-[1200px]">

            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7180ff]">
                Services
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#c5cee8]">
                Government Assistance
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Access essential government service assistance through
                a single personalized platform.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              <ServiceCard
                icon="✓"
                title="Eligibility Checking"
                text="Identify government services that match your age, income, occupation, state and other eligibility conditions."
              />

              <ServiceCard
                icon="✨"
                title="AI Recommendations"
                text="Receive personalized government service recommendations based on your natural-language requirement."
              />

              <ServiceCard
                icon="🔎"
                title="Service Discovery"
                text="Search and explore government schemes, certificates and other citizen-oriented services."
              />

            </div>

          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section
          id="features"
          className="border-t border-slate-600/30 bg-[#0b1220] px-10 py-20"
        >
          <div className="mx-auto max-w-[1200px]">

            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7180ff]">
                Key Features
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#c5cee8]">
                Designed Around Citizens
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              <FeatureCard
                icon="👤"
                title="Citizen Profile"
                text="Maintain personal information used for personalized service eligibility."
              />

              <FeatureCard
                icon="🔐"
                title="Secure Authentication"
                text="Register and access the platform through secure citizen authentication."
              />

              <FeatureCard
                icon="📄"
                title="Service Information"
                text="View service descriptions, eligibility, required documents and application links."
              />

              <FeatureCard
                icon="⚡"
                title="Personalized Assistance"
                text="Receive government service assistance based on your individual circumstances."
              />

              <FeatureCard
                icon="🧠"
                title="AI-Powered Analysis"
                text="Use Gemini AI to analyse citizen requirements and identify relevant services."
              />

              <FeatureCard
                icon="🌐"
                title="Centralized Platform"
                text="Access multiple categories of government services through one platform."
              />

            </div>

          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section
          id="how-it-works"
          className="border-t border-slate-600/30 px-10 py-20"
        >
          <div className="mx-auto max-w-[1050px]">

            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7180ff]">
                How It Works
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#c5cee8]">
                Simple. Personalized. Intelligent.
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                The platform combines eligibility evaluation with
                AI-assisted service recommendation.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-4">

              <Step
                number="01"
                title="Create Profile"
                text="Register and provide your personal and eligibility information."
              />

              <Step
                number="02"
                title="Check Eligibility"
                text="The system identifies services that match your profile."
              />

              <Step
                number="03"
                title="Describe Requirement"
                text="Enter what type of government service you need."
              />

              <Step
                number="04"
                title="Get Recommendation"
                text="Gemini AI identifies the most relevant eligible services."
              />

            </div>

          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-600/30 px-10 py-7 text-center text-sm text-slate-500">
        AI-Powered Citizen Assistance Platform for E-Governance
      </footer>

    </div>
  );
}


/* ================= SERVICE CARD ================= */

function ServiceCard({ icon, title, text }) {
  return (
    <div className="group rounded-lg border border-slate-600/40 bg-[#151e31] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-400/40 hover:bg-[#1b263b] hover:shadow-xl hover:shadow-black/20">

      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500/10 text-xl text-indigo-300 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#c5cee8]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </div>
  );
}


/* ================= FEATURE CARD ================= */

function FeatureCard({ icon, title, text }) {
  return (
    <div className="group rounded-lg border border-slate-600/30 bg-[#151e31] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-400/30 hover:bg-[#1b263b] hover:shadow-xl hover:shadow-indigo-950/20">

      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500/10 text-xl text-indigo-300 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#c5cee8]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </div>
  );
}


/* ================= STEP ================= */

function Step({ number, title, text }) {
  return (
    <div className="rounded-lg border border-slate-600/30 bg-[#151e31] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30">

      <div className="text-sm font-bold text-indigo-400">
        {number}
      </div>

      <h3 className="mt-4 font-semibold text-[#c5cee8]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </div>
  );
}

export default Landing;