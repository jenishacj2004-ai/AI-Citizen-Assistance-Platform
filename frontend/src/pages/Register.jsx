import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    gender: "Male",
    dob: "",
    category: "General",
    state: "Kerala",
    district: "",
    occupation: "",
    annual_income: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim(),
          gender: formData.gender,
          dob: formData.dob,
          category: formData.category,
          state: formData.state,
          district: formData.district.trim(),
          occupation: formData.occupation.trim(),
          annual_income: Number(formData.annual_income),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      setSuccess("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f172a] text-[#e4e2e4]">

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[10%] h-[40%] w-[40%] rounded-full bg-teal-400/[0.05] blur-[120px]" />

        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-400/[0.04] blur-[110px]" />
      </div>

      {/* Main */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">

        <div className="w-full max-w-4xl">

          {/* Brand */}
          <div className="mb-8 text-center">

            <Link
              to="/"
              className="text-[32px] font-bold tracking-tight text-[#bec6e0] transition duration-300 hover:text-white"
            >
              Citizen<span className="text-[#2dd4bf]">AI</span>
            </Link>

            <p className="mt-2 text-base text-[#94a3b8]">
              Secure E-Governance Platform Initialization
            </p>

          </div>

          {/* Glass Card */}
          <div className="group relative overflow-hidden rounded-xl border border-teal-400/20 bg-[rgba(30,41,59,0.7)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-8 ">

            {/* Hover accent line */}
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#2dd43e] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="mb-8">

              <h1 className="text-2xl font-semibold text-[#e4e2e4]">
                Create Account
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#94a3b8]">
                Create your citizen profile to receive personalized
                government service assistance.
              </p>

            </div>

            <form onSubmit={handleRegister}>

              {/* Personal Information */}
              <div className="mb-8">

                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#ceede8]">
                  Personal Information
                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                  {/* Full Name */}
                  <InputField
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    icon="👤"
                    required
                  />

                  {/* Email */}
                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="citizen@example.com"
                    icon="✉"
                    required
                  />

                  {/* Phone */}
                  <InputField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    icon="☎"
                    required
                  />

                  {/* Gender */}
                  <SelectField
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={[
                      "Male",
                      "Female",
                      "Other",
                    ]}
                    icon="◉"
                  />

                  {/* Date of Birth */}
                  <InputField
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    icon="📅"
                    required
                  />

                  {/* Category */}
                  <SelectField
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={[
                      "General",
                      "OBC",
                      "SC",
                      "ST",
                      "EWS",
                    ]}
                    icon="▣"
                  />

                </div>

              </div>

              {/* Location & Eligibility */}
              <div className="mb-8">

                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#2dd4bf]">
                  Location & Eligibility
                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                  {/* State */}
                  <InputField
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter your state"
                    icon="⌖"
                    required
                  />

                  {/* District */}
                  <InputField
                    label="District"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Enter your district"
                    icon="⌖"
                    required
                  />

                  {/* Occupation */}
                  <InputField
                    label="Occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="e.g. Student"
                    icon="💼"
                    required
                  />

                  {/* Annual Income */}
                  <InputField
                    label="Annual Income"
                    name="annual_income"
                    type="number"
                    value={formData.annual_income}
                    onChange={handleChange}
                    placeholder="Enter annual income"
                    icon="₹"
                    required
                  />

                </div>

              </div>

              {/* Security */}
              <div className="mb-8">

                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#2dd4bf]">
                  Account Security
                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                  {/* Password */}
                  <PasswordField
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    placeholder="••••••••"
                  />

                  {/* Confirm */}
                  <PasswordField
                    label="Confirm Password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                    placeholder="••••••••"
                  />

                </div>

              </div>

              {/* Terms */}
              <div className="mb-6 flex items-start">

                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#334155] bg-[#1e293b] text-[#2dd4bf] focus:ring-[#2dd4bf]"
                />

                <label
                  htmlFor="terms"
                  className="ml-3 text-sm leading-6 text-[#c6c6cd]"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-[#2dd4bf] hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-[#2dd4bf] hover:underline"
                  >
                    Privacy Policy
                  </button>
                  .
                </label>

              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="mb-5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {success}
                </div>
              )}

              {/* Register */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-[#f8fafc] px-4 py-3.5 font-bold text-[#0f172a] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="mr-2 text-lg">
                  {loading ? "⏳" : "→"}
                </span>

                {loading ? "Creating Account..." : "Register"}
              </button>

            </form>

            {/* Login redirect */}
            <div className="mt-7 border-t border-[#45464d]/50 pt-6 text-center">

              <p className="text-sm text-[#c6c6cd]">
                Already have an account?

                <Link
                  to="/login"
                  className="ml-2 font-bold text-[#2dd4bf] transition-colors hover:text-[#84d5ca] hover:underline"
                >
                  Log in
                </Link>
              </p>

            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 text-center">

            <p className="text-xs font-medium tracking-wide text-[#94a3b8]">
              ⚖ Official E-Governance Platform
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   INPUT FIELD
   ========================================================= */

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  required = false,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[#c6c6cd]"
      >
        {label}
      </label>

      <div className="relative">

        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#94a3b8]">
          {icon}
        </div>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg border border-[#334155] bg-[#1e293b] py-3 pl-10 pr-3 text-sm text-[#e4e2e4] outline-none transition-all duration-300 placeholder:text-[#94a3b8]/50 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20"
        />

      </div>

    </div>
  );
}


/* =========================================================
   SELECT FIELD
   ========================================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  icon,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[#c6c6cd]"
      >
        {label}
      </label>

      <div className="relative">

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-[#94a3b8]">
          {icon}
        </div>

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-lg border border-[#334155] bg-[#1e293b] py-3 pl-10 pr-9 text-sm text-[#e4e2e4] outline-none transition-all duration-300 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20"
        >
          {options.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-[#1e293b] text-white"
            >
              {option}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#94a3b8]">
          ▼
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PASSWORD FIELD
   ========================================================= */

function PasswordField({
  label,
  name,
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[#c6c6cd]"
      >
        {label}
      </label>

      <div className="relative">

        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#94a3b8]">
          🔒
        </div>

        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full rounded-lg border border-[#334155] bg-[#1e293b] py-3 pl-10 pr-11 text-sm text-[#e4e2e4] outline-none transition-all duration-300 placeholder:text-[#94a3b8]/50 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#94a3b8] transition hover:text-white"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "◉" : "◌"}
        </button>

      </div>

    </div>
  );
}

export default Register;