import { useEffect, useState } from "react";

function AIRecommendation() {
  const [serviceType, setServiceType] = useState("Certificate");
  const [query, setQuery] = useState("");

  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState("eligibility");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);

  // Get logged-in user's profile
  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      setError("User ID not found. Please login again.");
      return;
    }

    fetch(`http://127.0.0.1:8000/profile/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        return response.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        setError("Unable to load your profile.");
      });
  }, []);

  const getRecommendations = async (section = "eligibility") => {
    if (!query.trim()) {
      setError("Please describe your requirement.");
      return;
    }

    const userId = localStorage.getItem("user_id");

    if (!userId) {
      setError("User ID not found. Please login again.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/recommend-services",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: Number(userId),
            service_type: serviceType,
            query: query,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();

      console.log("Recommendation API response:", data);

        setResult(data);
        setActiveSection(section);
    } catch (err) {
      setError("Unable to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-white">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-3xl shadow-lg shadow-indigo-500/10">
            ✨
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Citizen Service Assistant
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Find government services you may be eligible for and get
            personalized AI assistance based on your requirement.
          </p>
        </div>

        {/* Profile Card */}
        {profile && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/20 text-xl">
                👤
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Welcome, {profile.full_name}
                </h2>

                <p className="text-sm text-slate-400">
                  Your profile is used to identify relevant services.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

              <div className="rounded-2xl bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                <p className="text-xs text-slate-400">Occupation</p>
                <p className="mt-1 font-semibold">
                  {profile.occupation}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                <p className="text-xs text-slate-400">Annual Income</p>
                <p className="mt-1 font-semibold">
                  ₹{profile.annual_income}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                <p className="text-xs text-slate-400">Category</p>
                <p className="mt-1 font-semibold">
                  {profile.category}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                <p className="text-xs text-slate-400">State</p>
                <p className="mt-1 font-semibold capitalize">
                  {profile.state}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">

          <h2 className="mb-6 text-xl font-semibold">
            Find Government Services
          </h2>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Service Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Service Type
              </label>

              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Certificate">Certificate</option>
                <option value="Scheme">Scheme</option>
              
              </select>
            </div>

            {/* Requirement */}
            <div className="md:row-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Describe Your Requirement
              </label>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: I need an income certificate"
                rows="6"
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none transition duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

          </div>

          {/* Buttons */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <button
              onClick={() => getRecommendations("eligibility")}
              disabled={loading}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10">
                {loading
                  ? "Checking..."
                  : "✓ Check Eligible Services"}
              </span>
            </button>

            <button
              onClick={() => {
                if (result) {
                    setActiveSection("ai");
                } else {
                    getRecommendations("ai");
                }
                }}
              disabled={loading}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10">
                ✨ AI Recommendations
              </span>
            </button>

          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

        </div>

        {/* Result Navigation */}
        {result && (
          <div className="mt-8">

            <div className="mb-6 flex flex-wrap justify-center gap-3">

              <button
                onClick={() => setActiveSection("eligibility")}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 ${
                  activeSection === "eligibility"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                ✓ Eligible Services ({result.count})
              </button>

              <button
                onClick={() => setActiveSection("ai")}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 ${
                  activeSection === "ai"
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                ✨ AI Recommendation
              </button>

            </div>

            {/* Eligible Services */}
            {activeSection === "eligibility" && (
              <div className="animate-[fadeIn_0.4s_ease-out]">

                <div className="mb-5">
                  <h2 className="text-2xl font-bold">
                    Eligible Government Services
                  </h2>

                  <p className="mt-1 text-slate-400">
                    Services matching your profile and eligibility criteria.
                  </p>
                </div>

                {result.services && result.services.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                    {result.services.map((service, index) => (
                      <div
                        key={index}
                        className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-emerald-400/30 hover:bg-white/10 hover:shadow-2xl"
                      >

                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl transition duration-300 group-hover:scale-110">
                            ✓
                          </div>

                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                            Eligible
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-white">
                          {service.service_name}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {service.description}
                        </p>

                        <div className="mt-5 border-t border-white/10 pt-4">
                          <p className="text-xs text-slate-500">
                            Required Documents
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {service.required_documents}
                          </p>
                        </div>

                        {service.application_link && (
                          <a
                            href={service.application_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition duration-300 hover:gap-3 hover:text-emerald-300"
                          >
                            Apply / Learn More →
                          </a>
                        )}

                      </div>
                    ))}

                  </div>
                ) : (
                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-8 text-center">
                    <div className="text-4xl">🔎</div>

                    <h3 className="mt-3 text-lg font-semibold">
                      No eligible services found
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      We could not find services matching your current
                      profile and selected service type.
                    </p>
                  </div>
                )}

              </div>
            )}
{activeSection === "ai" && (
  <div className="animate-[fadeIn_0.4s_ease-out]">

    <div className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">

      {/* AI Header */}
      <div className="mb-7 flex items-center gap-4">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl">
          ✨
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            AI Recommendation
          </h2>

          <p className="text-sm text-slate-400">
            Personalized recommendations based on your requirement.
          </p>
        </div>

      </div>

      {/* AI Recommendations */}
      {result?.ai_recommendation?.recommendations &&
      result.ai_recommendation.recommendations.length > 0 ? (

        <div className="space-y-5">

          {result.ai_recommendation.recommendations.map(
            (recommendation, index) => (

              <div
                key={index}
                className="group rounded-2xl border border-white/10 bg-black/20 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-black/30"
              >

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    {index + 1}
                  </div>

                  <h3 className="text-lg font-semibold text-white">
                    {recommendation.service_name}
                  </h3>

                </div>

                {recommendation.why_relevant && (
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                      Why it is relevant
                    </p>

                    <p className="text-sm leading-6 text-slate-300">
                      {recommendation.why_relevant}
                    </p>
                  </div>
                )}

                {recommendation.benefit && (
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Benefit
                    </p>

                    <p className="text-sm leading-6 text-slate-300">
                      {recommendation.benefit}
                    </p>
                  </div>
                )}

                {recommendation.required_documents && (
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-yellow-300">
                      Required Documents
                    </p>

                    <p className="text-sm leading-6 text-slate-300">
                      {recommendation.required_documents}
                    </p>
                  </div>
                )}

                {recommendation.how_to_apply && (
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-300">
                      How to Apply
                    </p>

                    <p className="text-sm leading-6 text-slate-300">
                      {recommendation.how_to_apply}
                    </p>
                  </div>
                )}

                {recommendation.application_link && (
                  <a
                    href={recommendation.application_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 font-semibold text-indigo-400 transition-all duration-300 hover:gap-3 hover:text-indigo-300"
                  >
                    Visit Application Portal →
                  </a>
                )}

              </div>
            )
          )}

        </div>

      ) : (

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-8 text-center">

          <div className="mb-3 text-4xl">
            🔎
          </div>

          <h3 className="font-semibold text-yellow-200">
            No closely matching service found
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            No eligible service closely matches your requirement.
          </p>

        </div>

      )}

    </div>

  </div>
)}
          </div>
        )}

      </div>
    </div>
  );
}

export default AIRecommendation;