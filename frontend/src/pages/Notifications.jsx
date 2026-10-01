import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Notifications() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("user_role");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role !== "Citizen") {
      navigate("/login");
      return;
    }

    fetchNotifications();
  }, [role, navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/notifications?user_id=${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to load notifications.");
        return;
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);

    } catch (error) {
      console.error(error);
      setError("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read?user_id=${userId}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to mark notification as read.");
        return;
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((previousCount) =>
        previousCount > 0 ? previousCount - 1 : 0
      );

    } catch (error) {
      console.error(error);
      setError("Unable to connect to backend.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
            Stay updated with important announcements
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-gray-600 px-4 py-2 font-medium hover:bg-gray-700"
        >
          Back to Dashboard
        </button>

      </header>

      {/* Main */}
      <main className="p-6">

        <div className="mx-auto max-w-4xl">

          {/* Summary */}
          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                Your Notifications
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={fetchNotifications}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Refresh
            </button>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="rounded-xl border border-gray-700 bg-[#111c30] p-8 text-center">
              <p className="text-gray-400">
                Loading notifications...
              </p>
            </div>
          )}

          {/* No notifications */}
          {!loading && notifications.length === 0 && (
            <div className="rounded-xl border border-gray-700 bg-[#111c30] p-10 text-center">

              <div className="mb-3 text-4xl">
                🔔
              </div>

              <h3 className="text-lg font-semibold">
                No Notifications
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                You don't have any notifications yet.
              </p>

            </div>
          )}

          {/* Notification List */}
          {!loading && notifications.length > 0 && (
            <div className="space-y-4">

              {notifications.map((notification) => (

                <div
                  key={notification.notification_id}
                  className={`rounded-xl border p-5 ${
                    notification.is_read
                      ? "border-gray-700 bg-[#111c30]"
                      : "border-blue-700 bg-blue-900/20"
                  }`}
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex-1">

                      <div className="mb-2 flex items-center gap-3">

                        <h3 className="text-lg font-semibold">
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-medium">
                            New
                          </span>
                        )}

                      </div>

                      <p className="mb-3 text-sm text-gray-300">
                        {notification.message}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">

                        <span>
                          Type: {notification.notification_type}
                        </span>

                        <span>
                          {formatDate(notification.created_at)}
                        </span>

                      </div>

                    </div>

                    {!notification.is_read && (
                      <button
                        onClick={() =>
                          markAsRead(notification.notification_id)
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-700"
                      >
                        Mark as Read
                      </button>
                    )}

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default Notifications;