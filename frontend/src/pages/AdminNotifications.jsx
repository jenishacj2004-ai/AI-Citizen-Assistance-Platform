import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminNotifications() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("user_role");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState(
    "General Announcement"
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Admin protection
  useEffect(() => {
    if (role !== "Admin") {
      navigate("/dashboard");
    }
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    if (!title.trim() || !message.trim()) {
      setError("Please enter both title and message.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/notifications?user_id=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            notification_type: notificationType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to send announcement.");
        return;
      }

      setSuccess(
        `${data.message}. Sent to ${data.citizen_count} citizen(s).`
      );

      // Clear form
      setTitle("");
      setMessage("");
      setNotificationType("General Announcement");

    } catch (error) {
      console.error(error);
      setError("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-[#111c30] px-6 py-4">

        <div>
          <h1 className="text-2xl font-bold">
            Notifications
          </h1>

          <p className="text-sm text-gray-400">
            Create and send announcements to citizens
          </p>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-700"
        >
          Back to Admin
        </button>

      </header>

      {/* Main */}
      <main className="p-6">

        <div className="mx-auto max-w-3xl">

          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Create Announcement
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Send an announcement to all registered citizens.
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-5 rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-700 bg-[#111c30] p-6"
          >

            {/* Title */}
            <div className="mb-5">

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Notification Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: New Government Scheme Available"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-blue-500"
              />

            </div>

            {/* Type */}
            <div className="mb-5">

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Notification Type
              </label>

              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option>General Announcement</option>
                <option>Government Scheme</option>
                <option>Service Update</option>
                <option>Important Notice</option>
                <option>System Announcement</option>
              </select>

            </div>

            {/* Message */}
            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Message
              </label>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the announcement message..."
                rows="6"
                className="w-full resize-none rounded-lg border border-gray-600 bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-blue-500"
              />

            </div>

            {/* Recipient */}
            <div className="mb-6 rounded-lg border border-blue-800 bg-blue-900/20 p-4">

              <p className="text-sm font-medium text-blue-300">
                Recipients
              </p>

              <p className="mt-1 text-sm text-gray-400">
                This announcement will be sent to all registered citizens.
              </p>

            </div>

            {/* Buttons */}
            <div className="flex gap-3">

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Announcement"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="rounded-lg bg-gray-600 px-5 py-2.5 font-medium hover:bg-gray-700"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default AdminNotifications;