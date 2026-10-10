import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dynamic eligibility questions & evaluation state
  const [eligibilityInfo, setEligibilityInfo] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetchService();
    if (userId) {
      fetchDynamicQuestions();
    }
  }, [serviceId, userId]);

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

  const fetchDynamicQuestions = async () => {
    try {
      setLoadingQuestions(true);

      const response = await fetch(
        `${API_BASE_URL}/eligibility/required-information/${serviceId}?user_id=${userId}`
      );

      const data = await response.json();

      if (response.ok && data.required_information?.length > 0) {
        setEligibilityInfo(data);

        // Pre-populate available profile / document fields
        const initialAnswers = {};
        data.required_information.forEach((item) => {
          if (item.already_available && item.current_value !== null) {
            initialAnswers[item.field_name] = item.current_value;
          }
        });

        setAnswers((prev) => ({ ...initialAnswers, ...prev }));
      }
    } catch (err) {
      console.error("Failed to load required information questions", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerChange = (fieldName, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    // Clear previous evaluation when inputs change
    if (evaluationResult) {
      setEvaluationResult(null);
    }
  };

  const handleResetAnswers = () => {
    const initialAnswers = {};
    if (eligibilityInfo?.required_information) {
      eligibilityInfo.required_information.forEach((item) => {
        if (item.already_available && item.current_value !== null) {
          initialAnswers[item.field_name] = item.current_value;
        }
      });
    }
    setAnswers(initialAnswers);
    setEvaluationResult(null);
  };

  const handleEvaluateEligibility = async () => {
    if (!userId) {
      alert("Please log in to evaluate your eligibility.");
      navigate("/login");
      return;
    }

    try {
      setEvaluating(true);
      setEvaluationResult(null);

      const response = await fetch(`${API_BASE_URL}/eligibility/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(userId),
          service_id: Number(serviceId),
          answers: answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Eligibility evaluation failed");
        return;
      }

      setEvaluationResult(data);

      // Scroll to result card
      setTimeout(() => {
        const el = document.getElementById("evaluation-result-card");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

    } catch (err) {
      console.error("Eligibility check error", err);
      alert("Unable to connect to backend eligibility service.");
    } finally {
      setEvaluating(false);
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
              onClick={() => navigate("/notifications")}
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
              GOVERNMENT SERVICE • SCHEME ID #{service.service_id}
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

              {service.eligibility_mode && (
                <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs text-purple-300">
                  Mode: {service.eligibility_mode}
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

              {/* Eligibility Criteria Overview */}
              <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6">
                <h2 className="text-lg font-semibold text-white">
                  Official Eligibility Guidelines
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-400">
                  {service.eligibility ||
                    "Eligibility information is not available."}
                </p>
              </section>

              {/* ================= DYNAMIC ELIGIBILITY SELF-ASSESSMENT ================= */}
              {eligibilityInfo?.required_information && eligibilityInfo.required_information.length > 0 && (
                <section
                  id="eligibility-assessment"
                  className="rounded-2xl border border-indigo-500/30 bg-[#121a2f] p-6 shadow-xl"
                >
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                          Interactive Assessment
                        </span>
                        <h2 className="mt-2 text-xl font-bold text-white">
                          Check Your {service.service_name} Eligibility
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                          Answer the criteria questions below derived dynamically from the official scheme rules.
                        </p>
                      </div>

                      {eligibilityInfo.profile_summary && (
                        <div className="rounded-lg bg-[#0b1220] p-3 text-xs border border-white/10 shrink-0">
                          <p className="text-slate-400 font-medium">Logged-in Profile:</p>
                          <p className="text-slate-200 font-semibold">
                            {eligibilityInfo.profile_summary.full_name}
                          </p>
                          <p className="text-indigo-300">
                            Category: {eligibilityInfo.profile_summary.category || "Not specified"}
                          </p>
                          <p className="text-slate-300">
                            Occupation: {eligibilityInfo.profile_summary.occupation || "Not specified"}
                          </p>
                          {eligibilityInfo.profile_summary.annual_income !== null && (
                            <p className="text-emerald-400 font-mono">
                              Income: ₹{Number(eligibilityInfo.profile_summary.annual_income).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Profile-Based Income Assessment Banner */}
                    {eligibilityInfo.income_assessment && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-200 flex items-start gap-3">
                        <span className="text-base text-emerald-400">⚡</span>
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-emerald-300">
                              Profile-Based Income Assessment (Service ID #{service.service_id}):
                            </p>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              eligibilityInfo.income_assessment.assessment_status?.includes("EXEMPT")
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                                : eligibilityInfo.income_assessment.assessment_status === "PASSED"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : eligibilityInfo.income_assessment.assessment_status === "FAILED"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}>
                              {eligibilityInfo.income_assessment.assessment_status}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {eligibilityInfo.income_assessment.explanation}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-300">
                            <span className="rounded bg-black/40 px-2 py-0.5 border border-white/10">
                              Category: <strong className="text-white">{eligibilityInfo.income_assessment.category || "Not specified"}</strong>
                            </span>
                            {eligibilityInfo.income_assessment.annual_income !== null && (
                              <span className="rounded bg-black/40 px-2 py-0.5 border border-white/10">
                                Annual Income: <strong className="text-white">₹{Number(eligibilityInfo.income_assessment.annual_income).toLocaleString("en-IN")}</strong>
                              </span>
                            )}
                            <span className="rounded bg-black/40 px-2 py-0.5 border border-white/10">
                              Applicable Ceiling: <strong className="text-white">{eligibilityInfo.income_assessment.applicable_ceiling || "None (Exempt)"}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profile-Aware Explanatory Note (Task 5) */}
                    {eligibilityInfo.profile_note && (
                      <div className="rounded-xl border border-indigo-400/20 bg-indigo-950/30 p-3.5 text-xs text-indigo-200 flex items-start gap-3">
                        <span className="text-base text-indigo-400">ℹ</span>
                        <div className="space-y-1">
                          <p className="font-semibold text-indigo-300">Profile Context Notice:</p>
                          <p className="text-slate-300 leading-relaxed">
                            {eligibilityInfo.profile_note}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Questions Form */}
                  <div className="mt-6 space-y-5">
                    {eligibilityInfo.required_information.map((item, idx) => {
                      const currentValue = answers[item.field_name];
                      const isAnswered = currentValue !== undefined && currentValue !== null;
                      const isExclusion = item.rule_type === "EXCLUSION";

                      return (
                        <div
                          key={item.rule_id || idx}
                          className={`rounded-xl border p-4 transition-all ${
                            isAnswered
                              ? "border-indigo-500/40 bg-[#0d1627]"
                              : "border-white/10 bg-[#0b1220]"
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                                  {idx + 1}
                                </span>
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isExclusion
                                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  }`}
                                >
                                  {isExclusion ? "Official Exclusion Check" : "Eligibility Requirement"}
                                </span>

                                {item.already_available && (
                                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                                    ● Prefilled from {item.source === "verified_documents" ? "verified document" : "profile"}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm font-semibold text-slate-100">
                                {item.question}
                              </h3>

                              {item.help_text && (
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {item.help_text}
                                </p>
                              )}
                            </div>

                            {/* Yes / No Radio Buttons */}
                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => handleAnswerChange(item.field_name, true)}
                                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                                  currentValue === true
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                Yes
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAnswerChange(item.field_name, false)}
                                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                                  currentValue === false
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Exceptions / Guidelines Assistance Notice */}
                    {Number(serviceId) === 11 ? (
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-xs text-indigo-200">
                        <p className="font-semibold text-indigo-300 mb-1">
                          ℹ Official Scheme Guidelines:
                        </p>
                        <p>
                          Under Kerala E-Grantz 3.0, SC and ST students have no annual income ceiling. OEC students are eligible up to an annual family income of ₹6 Lakh. OBC and General/EBC students have an annual income ceiling of ₹1 Lakh. A minimum 75% attendance certified by the institution head and an active Aadhaar-linked DBT bank account are mandatory.
                        </p>
                      </div>
                    ) : Number(serviceId) === 12 ? (
                      <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 text-xs text-purple-200">
                        <p className="font-semibold text-purple-300 mb-1">
                          ℹ Official Exception Notice:
                        </p>
                        <p>
                          Under PM-KISAN Operational Guidelines, Multi-Tasking Staff (MTS), Class IV, and Group D employees / pensioners are officially EXEMPT from government employment and pension exclusion categories. If you belong to Group D / MTS, this exception is applied during evaluation.
                        </p>
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleResetAnswers}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                      >
                        Reset All Answers
                      </button>

                      <button
                        type="button"
                        disabled={evaluating}
                        onClick={handleEvaluateEligibility}
                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                      >
                        {evaluating ? "Evaluating Eligibility..." : "Evaluate My Eligibility →"}
                      </button>
                    </div>
                  </div>

                  {/* ================= EVALUATION RESULT (TASKS 3, 4, 5, 6) ================= */}
                  {evaluationResult && (
                    <div
                      id="evaluation-result-card"
                      className={`mt-8 rounded-2xl border p-6 transition-all ${
                        evaluationResult.status === "ELIGIBLE"
                          ? "border-emerald-500/50 bg-[#092019] shadow-xl shadow-emerald-500/10"
                          : evaluationResult.status === "NOT ELIGIBLE"
                          ? "border-rose-500/50 bg-[#230d14] shadow-xl shadow-rose-500/10"
                          : "border-amber-500/50 bg-[#241708] shadow-xl shadow-amber-500/10"
                      }`}
                    >
                      {/* Section 1: Preliminary Assessment & Overall Status Header */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-white/10 pb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                                evaluationResult.status === "ELIGIBLE"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : evaluationResult.status === "NOT ELIGIBLE"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              <span>
                                {evaluationResult.status === "ELIGIBLE"
                                  ? "✓"
                                  : evaluationResult.status === "NOT ELIGIBLE"
                                  ? "✕"
                                  : "!"}
                              </span>
                              <span>{evaluationResult.status}</span>
                            </span>

                            <span className="text-xs text-slate-400 font-medium">
                              Preliminary Assessment Result
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-white leading-snug">
                            {evaluationResult.message}
                          </h3>
                        </div>

                        {/* Match Score */}
                        <div className="rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-right shrink-0">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Rule Match Score
                          </p>
                          <p
                            className={`text-xl font-extrabold font-mono ${
                              evaluationResult.status === "ELIGIBLE"
                                ? "text-emerald-400"
                                : evaluationResult.status === "NOT ELIGIBLE"
                                ? "text-rose-400"
                                : "text-amber-400"
                            }`}
                          >
                            {evaluationResult.match_score !== undefined
                              ? `${evaluationResult.match_score}%`
                              : evaluationResult.status === "ELIGIBLE"
                              ? "100%"
                              : "Pending"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {evaluationResult.satisfied_criteria_count !== undefined && evaluationResult.total_criteria_count !== undefined
                              ? `${evaluationResult.satisfied_criteria_count} of ${evaluationResult.total_criteria_count} criteria satisfied${
                                  evaluationResult.exempt_criteria?.length
                                    ? ` (${evaluationResult.exempt_criteria.length} category exempt)`
                                    : ""
                                }`
                              : "Based on configured scheme rules"}
                          </p>
                        </div>
                      </div>

                      {/* Section 2: Profile-Aware Explanation (Task 5) */}
                      {evaluationResult.profile_note && (
                        <div className="mt-4 rounded-xl bg-[#0b1220]/80 border border-indigo-500/30 p-3.5 text-xs text-indigo-200 flex items-start gap-2.5">
                          <span className="text-base text-indigo-400">👤</span>
                          <div>
                            <p className="font-semibold text-indigo-300">Profile Awareness Context:</p>
                            <p className="mt-0.5 text-slate-300 leading-relaxed">
                              {evaluationResult.profile_note}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Section 3: Official Exceptions Applied */}
                      {evaluationResult.exceptions_applied?.length > 0 && (
                        <div className="mt-4 rounded-xl bg-purple-950/40 border border-purple-500/30 p-3.5 text-xs text-purple-200">
                          <p className="font-semibold text-purple-300">
                            ★ Official Scheme Exception Applied:
                          </p>
                          <ul className="mt-1 list-disc list-inside space-y-1 text-purple-100">
                            {evaluationResult.exceptions_applied.map((exc, i) => (
                              <li key={i}>{exc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Section 4: Manual Verification Requirements */}
                      {evaluationResult.manual_verification_required && (
                        <div className="mt-3 rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-200">
                          <p className="font-semibold text-amber-300">
                            ⚠ Manual Verification Required by Nodal Authority:
                          </p>
                          <ul className="mt-1 list-disc list-inside space-y-1 text-amber-100">
                            {evaluationResult.manual_verification_details?.map((det, i) => (
                              <li key={i}>{det}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ================= DETAILED CRITERIA BREAKDOWN ================= */}
                      <div className="mt-6 space-y-5">

                        {/* Category Exempt Criteria (Not Applicable) */}
                        {evaluationResult.exempt_criteria && evaluationResult.exempt_criteria.length > 0 && (
                          <div className="rounded-xl bg-indigo-950/20 border border-indigo-500/30 p-4">
                            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                              <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                <span>★</span>
                                <span>Category Exempt Criteria (Not Applicable)</span>
                              </p>
                              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                                {evaluationResult.exempt_criteria.length} Category Exempt
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] text-slate-400">
                              The following scheme criterion is verified as officially exempt for your community category:
                            </p>

                            <div className="mt-3 space-y-2">
                              {evaluationResult.exempt_criteria.map((rule, i) => (
                                <div
                                  key={rule.rule_id || i}
                                  className="rounded-lg bg-black/40 border border-indigo-500/20 p-3 text-xs flex items-start gap-2.5"
                                >
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                                    ★
                                  </span>
                                  <div className="space-y-0.5 w-full">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <p className="font-semibold text-slate-100">
                                        {rule.title || rule.description || rule.field_name}
                                      </p>
                                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                                        {rule.status || "NOT APPLICABLE — category exempt"}
                                      </span>
                                    </div>
                                    <p className="text-indigo-200/90 text-[11px]">
                                      {rule.detail || rule.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* A. REQUIREMENTS SATISFIED (Green styling) */}
                        {((evaluationResult.requirements_satisfied && evaluationResult.requirements_satisfied.length > 0) ||
                          (evaluationResult.passed_rules && evaluationResult.passed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'REQUIREMENT').length > 0)) && (
                          <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <span>✓</span>
                                <span>Requirements Satisfied</span>
                              </p>
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                {(evaluationResult.requirements_satisfied || evaluationResult.passed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'REQUIREMENT')).length} Satisfied
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              {(evaluationResult.requirements_satisfied || evaluationResult.passed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'REQUIREMENT')).map((rule, i) => (
                                <div
                                  key={rule.rule_id || i}
                                  className="rounded-lg bg-black/40 border border-emerald-500/20 p-3 text-xs flex items-start gap-2.5"
                                >
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 shrink-0 mt-0.5">
                                    ✓
                                  </span>
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-slate-100">
                                      {rule.title || rule.description || rule.field_name}
                                    </p>
                                    <p className="text-emerald-300/90 text-[11px]">
                                      {rule.detail || rule.description || "Positive eligibility requirement verified and satisfied."}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* B. EXCLUSIONS CHECKED (Neutral / Slate styling) */}
                        {((evaluationResult.exclusions_checked && evaluationResult.exclusions_checked.length > 0) ||
                          (evaluationResult.passed_rules && evaluationResult.passed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'EXCLUSION').length > 0)) && (
                          <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <span>🛡</span>
                                <span>Exclusions Checked (No Exclusion Triggered)</span>
                              </p>
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                                {(evaluationResult.exclusions_checked || evaluationResult.passed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'EXCLUSION')).length} Verified Clear
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] text-slate-400">
                              Applicant verified not to fall under any of the following statutory scheme exclusion categories:
                            </p>

                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {(evaluationResult.exclusions_checked || evaluationResult.passed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'EXCLUSION')).map((rule, i) => (
                                <div
                                  key={rule.rule_id || i}
                                  className="rounded-lg bg-black/30 border border-slate-700/40 p-2.5 text-xs flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-xs">●</span>
                                    <span className="text-slate-200 font-medium">
                                      {rule.title || rule.description || rule.field_name}
                                    </span>
                                  </div>
                                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-400 font-medium shrink-0">
                                    No exclusion reported
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* C. FAILED REQUIREMENTS (Red styling) */}
                        {((evaluationResult.failed_requirements && evaluationResult.failed_requirements.length > 0) ||
                          (evaluationResult.failed_rules && evaluationResult.failed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'REQUIREMENT').length > 0)) && (
                          <div className="rounded-xl bg-rose-950/30 border border-rose-500/40 p-4">
                            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                <span>✕</span>
                                <span>Failed Requirements</span>
                              </p>
                              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                {(evaluationResult.failed_requirements || evaluationResult.failed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'REQUIREMENT')).length} Failed
                              </span>
                            </div>

                            <div className="mt-3 space-y-2.5">
                              {(evaluationResult.failed_requirements || evaluationResult.failed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'REQUIREMENT')).map((rule, i) => (
                                <div
                                  key={rule.rule_id || i}
                                  className="rounded-lg bg-black/50 border border-rose-500/30 p-3.5 text-xs space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-bold text-rose-200 text-sm">
                                      {rule.title || rule.description || rule.field_name}
                                    </p>
                                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 shrink-0">
                                      Your Answer: {rule.actual_value === false ? "No" : String(rule.actual_value || "Incomplete")}
                                    </span>
                                  </div>

                                  <p className="text-rose-300/90 text-xs">
                                    {rule.reason || "Requirement not satisfied under official scheme rules."}
                                  </p>

                                  {rule.action_needed && (
                                    <div className="mt-2 rounded bg-rose-900/30 border border-rose-500/20 p-2 text-[11px] text-rose-200">
                                      <strong className="text-rose-100">Next Action: </strong>
                                      {rule.action_needed}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* D. EXCLUSIONS IDENTIFIED / REASONS FOR INELIGIBILITY (Red styling) */}
                        {((evaluationResult.triggered_exclusions && evaluationResult.triggered_exclusions.length > 0) ||
                          (evaluationResult.failed_rules && evaluationResult.failed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'EXCLUSION').length > 0)) && (
                          <div className="rounded-xl bg-rose-950/30 border border-rose-500/40 p-4">
                            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                <span>⚠</span>
                                <span>Exclusions Triggered — Reason for Ineligibility</span>
                              </p>
                              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                {(evaluationResult.triggered_exclusions || evaluationResult.failed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'EXCLUSION')).length} Triggered
                              </span>
                            </div>

                            <div className="mt-3 space-y-2.5">
                              {(evaluationResult.triggered_exclusions || evaluationResult.failed_rules.filter(r => (r.rule_type || '').toUpperCase() === 'EXCLUSION')).map((rule, i) => (
                                <div
                                  key={rule.rule_id || i}
                                  className="rounded-lg bg-black/50 border border-rose-500/30 p-3.5 text-xs space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-bold text-rose-200 text-sm">
                                      {rule.title || rule.description || rule.field_name}
                                    </p>
                                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 shrink-0">
                                      Your Answer: Yes (Excluded)
                                    </span>
                                  </div>

                                  <p className="text-rose-300/90 text-xs">
                                    {rule.reason || "Exclusion condition matched: applicant is excluded under scheme rules."}
                                  </p>

                                  {rule.action_needed && (
                                    <div className="mt-2 rounded bg-rose-900/30 border border-rose-500/20 p-2 text-[11px] text-rose-200">
                                      <strong className="text-rose-100">Scheme Guideline: </strong>
                                      {rule.action_needed}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* E. MISSING INFORMATION (Amber styling) */}
                        {evaluationResult.missing_information?.length > 0 && (
                          <div className="rounded-xl bg-amber-950/30 border border-amber-500/40 p-4">
                            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                <span>!</span>
                                <span>Information Required — Unanswered Criteria</span>
                              </p>
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                {evaluationResult.missing_information.length} Pending
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              {evaluationResult.missing_information.map((rule, i) => (
                                <div
                                  key={rule.rule_id || i}
                                  className="rounded-lg bg-black/40 border border-amber-500/20 p-3 text-xs flex items-center justify-between gap-2 text-amber-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 font-bold">!</span>
                                    <div>
                                      <p className="font-semibold text-amber-100">
                                        {rule.title || rule.description || rule.field_name}
                                      </p>
                                      <p className="text-[11px] text-amber-300/80">
                                        {rule.reason || "Please select Yes or No above to complete assessment."}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                                    Answer Required
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Section 5: Recommended Next Steps */}
                      {evaluationResult.next_steps?.length > 0 && (
                        <div className="mt-6 rounded-xl bg-black/40 border border-white/10 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                            → Recommended Next Steps:
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                            {evaluationResult.next_steps.map((step, i) => (
                              <li key={i} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Section 6: Official Verification Disclaimer (Task 6) */}
                      <div className="mt-6 rounded-xl bg-[#0b1220] border border-white/10 p-4 text-xs text-slate-400 leading-relaxed">
                        <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                          Official Verification Disclaimer:
                        </p>
                        <p>
                          {evaluationResult.disclaimer || (
                            "Preliminary eligibility guidance: This assessment is based on the information provided and the scheme-specific rules configured in this application. It is not an official scholarship approval or guarantee of benefits. Final eligibility and assistance are determined by the competent department under the applicable scheme guidelines."
                          )}
                        </p>
                      </div>

                      {/* Section 7: Official Application Portal Link */}
                      {service.application_link && (
                        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            {evaluationResult.status === "ELIGIBLE"
                              ? "You may now proceed to apply on the official portal."
                              : "Visit the official portal for scheme guidelines and grievance redressal."}
                          </p>

                          <a
                            href={service.application_link}
                            target="_blank"
                            rel="noreferrer"
                            className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition shadow-lg shrink-0 ${
                              evaluationResult.status === "ELIGIBLE"
                                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                            }`}
                          >
                            Open Official {service.service_name || "Portal"} →
                          </a>
                        </div>
                      )}

                    </div>
                  )}
                </section>
              )}

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

              {/* Official Application Portal */}
              <section className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6">

                <h2 className="text-lg font-semibold text-white">
                  Official Government Portal
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Use the official government portal to submit your
                  application and track DBT disbursements.
                </p>

                {service.application_link ? (
                  <a
                    href={service.application_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 block rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Open Official Portal →
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