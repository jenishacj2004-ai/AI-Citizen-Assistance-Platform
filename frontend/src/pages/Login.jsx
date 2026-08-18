import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password.");
      }

      // Store user information for the rest of the application
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_name", data.name);

      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      // Go to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f172a] px-4 py-8 text-[#e4e2e4]">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-teal-400/[0.03] blur-[120px]" />

        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-300/[0.03] blur-[100px]" />
      </div>

      {/* Main Login Container */}
      <main className="relative z-10 w-full max-w-md">

        {/* Logo Header */}
        <div className="mb-8 text-center">

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 text-[32px] font-bold tracking-tight text-[#bec6e0] transition duration-300 hover:text-white"
          >
            <span className="text-[30px]">
              🛡
            </span>

            Citizen<span className="text-[#2dd4bf]">AI</span>
          </Link>

          <p className="mt-2 text-base text-[#c6c6cd]">
            Secure Government Access Portal
          </p>

        </div>

        {/* Glass Card */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/70 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">

          {/* Top hover line */}
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-slate-800 via-teal-400 to-slate-800 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#e4e2e4]"
              >
                Email or Citizen ID
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#c6c6cd]/70">
                  <span className="text-lg">
                    ◉
                  </span>
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. citizen@example.com"
                  autoComplete="email"
                  className="block w-full rounded-lg border border-[#45464d] bg-[#1e293b] py-3 pl-10 pr-3 text-base text-[#e4e2e4] outline-none placeholder:text-[#c6c6cd]/50 transition-all duration-200 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#e4e2e4]"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-medium text-[#2dd4bf] transition-colors hover:text-[#84d5ca]"
                  onClick={() => {
                    // Future password reset functionality
                    setError("Password reset is not available yet.");
                  }}
                >
                  Forgot Password?
                </button>

              </div>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#c6c6cd]/70">
                  <span className="text-lg">
                    🔒
                  </span>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="block w-full rounded-lg border border-[#45464d] bg-[#1e293b] py-3 pl-10 pr-11 text-base text-[#e4e2e4] outline-none placeholder:text-[#c6c6cd]/50 transition-all duration-200 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#c6c6cd] transition-colors hover:text-white"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-2">

              <label className="flex cursor-pointer items-center">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#45464d] bg-[#1e293b] text-[#2dd4bf] focus:ring-[#2dd4bf]"
                />

                <span className="ml-2 text-sm text-[#c6c6cd]">
                  Remember me
                </span>

              </label>

              <div className="flex items-center text-[#2dd4bf]/80">

                <span className="mr-1 text-xs">
                  🔐
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Secure
                </span>

              </div>

            </div>

            {/* Submit */}
            <div className="pt-4">

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-[#e4e2e4] px-4 py-3 font-bold text-[#0f172a] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >

                <span className="mr-2 text-lg">
                  {loading ? "⏳" : "→"}
                </span>

                {loading ? "Signing In..." : "Secure Sign In"}

              </button>

            </div>

          </form>

          {/* Register */}
          <div className="mt-8 border-t border-[#45464d]/50 pt-6 text-center">

            <p className="text-base text-[#c6c6cd]">
              Don't have an account?

              <Link
                to="/register"
                className="ml-2 font-semibold text-[#bec6e0] transition-colors hover:text-[#2dd4bf]"
              >
                Register here
              </Link>
            </p>

          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">

          <p className="flex items-center justify-center gap-1 text-xs font-medium tracking-wide text-[#94a3b8]">
            <span>
              ⚖
            </span>
            Official E-Governance Platform
          </p>

        </div>

      </main>
    </div>
  );
}

export default Login;