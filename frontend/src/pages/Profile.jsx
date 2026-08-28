import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "Citizen";

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    category: "",
    state: "",
    district: "",
    occupation: "",
    annual_income: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [userId, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/profile/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load profile."
        );
      }

      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dob: data.dob || "",
        category: data.category || "",
        state: data.state || "",
        district: data.district || "",
        occupation: data.occupation || "",
        annual_income:
          data.annual_income !== null &&
          data.annual_income !== undefined
            ? data.annual_income
            : "",
      });
    } catch (err) {
      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `http://127.0.0.1:8000/profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: profile.phone.trim(),
            state: profile.state.trim(),
            district: profile.district.trim(),
            occupation: profile.occupation
              ? profile.occupation.trim()
              : null,
            annual_income: Number(profile.annual_income),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update profile."
        );
      }

      setSuccess("Profile updated successfully.");

      await fetchProfile();
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0b1220] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
          <p className="mt-4 text-sm text-slate-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

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
              active
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
              onClick={handleLogout}
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
                Account
              </p>

              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                My Profile
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

          {/* Header */}
          <section className="mb-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-300">
                    👤
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-slate-100">
                      Profile
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage the information used for personalized
                      government service assistance.
                    </p>
                  </div>

                </div>

              </div>

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3">

                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                  Profile Status
                </p>

                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  ✓ Active
                </p>

              </div>

            </div>

          </section>

          {/* Messages */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[300px_1fr]">

            {/* ================= PROFILE SUMMARY ================= */}
            <section className="h-fit rounded-2xl border border-white/10 bg-[#141d2e] p-6">

              <div className="flex flex-col items-center text-center">

                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 text-3xl font-bold shadow-xl shadow-indigo-950/30">
                  {(profile.full_name || "C")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <h3 className="mt-5 text-xl font-semibold text-slate-100">
                  {profile.full_name || "Citizen"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {profile.occupation || "Citizen"}
                </p>

                <div className="mt-5 rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                  ● Verified Citizen
                </div>

              </div>

              <div className="mt-7 space-y-3">

                <SummaryItem
                  label="Email"
                  value={profile.email}
                />

                <SummaryItem
                  label="Phone"
                  value={profile.phone}
                />

                <SummaryItem
                  label="State"
                  value={profile.state}
                />

                <SummaryItem
                  label="District"
                  value={profile.district}
                />

              </div>

            </section>

            {/* ================= PROFILE FORM ================= */}
            <section className="rounded-2xl border border-white/10 bg-[#141d2e] p-6 shadow-xl lg:p-8">

              <form onSubmit={handleSave}>

                {/* Personal Information */}
                <div>

                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                      Personal Information
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-slate-100">
                      Citizen Details
                    </h3>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    <ReadOnlyField
                      label="Full Name"
                      value={profile.full_name}
                    />

                    <ReadOnlyField
                      label="Email Address"
                      value={profile.email}
                    />

                    <ReadOnlyField
                      label="Gender"
                      value={profile.gender}
                    />

                    <ReadOnlyField
                      label="Date of Birth"
                      value={formatDate(profile.dob)}
                    />

                  </div>

                </div>

                {/* Eligibility Information */}
                <div className="mt-10 border-t border-white/10 pt-8">

                  <div className="mb-5">

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">
                      Eligibility Information
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-slate-100">
                      Service Eligibility Profile
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      These details are used by the eligibility engine
                      and AI recommendation system.
                    </p>

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    <InputField
                      label="Phone Number"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />

                    <SelectField
                      label="Category"
                      name="category"
                      value={profile.category}
                      onChange={handleChange}
                      options={[
                        "General",
                        "OBC",
                        "SC",
                        "ST",
                        "EWS",
                        "Disabled",
                      ]}
                    />

                    <InputField
                      label="State"
                      name="state"
                      value={profile.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />

                    <InputField
                      label="District"
                      name="district"
                      value={profile.district}
                      onChange={handleChange}
                      placeholder="Enter district"
                    />

                    <InputField
                      label="Occupation"
                      name="occupation"
                      value={profile.occupation}
                      onChange={handleChange}
                      placeholder="e.g. Student, Farmer"
                    />

                    <InputField
                      label="Annual Income"
                      name="annual_income"
                      type="number"
                      value={profile.annual_income}
                      onChange={handleChange}
                      placeholder="Enter annual income"
                    />

                  </div>

                </div>

                {/* Save */}
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={fetchProfile}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                </div>

              </form>

            </section>

          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-600 lg:px-8">
          AI-Powered Citizen Assistance Platform for E-Governance
        </footer>

      </div>
    </div>
  );
}

/* ================= SIDEBAR ================= */

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

/* ================= READ ONLY FIELD ================= */

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-400">
        {label}
      </label>

      <div className="rounded-xl border border-white/5 bg-[#101827] px-4 py-3.5 text-sm text-slate-300">
        {value || "Not provided"}
      </div>
    </div>
  );
}

/* ================= INPUT FIELD ================= */

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#25334c] px-4 py-3.5 text-sm text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      />
    </div>
  );
}

/* ================= SELECT FIELD ================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-[#25334c] px-4 py-3.5 text-sm text-white outline-none transition duration-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#1e293b]"
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ================= SUMMARY ITEM ================= */

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-400">
        {value || "Not provided"}
      </p>
    </div>
  );
}

/* ================= DATE ================= */

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN");
}

export default Profile;