import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function DocumentVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = localStorage.getItem("user_id");

  const serviceIdFromUrl = searchParams.get("service_id");

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(
    serviceIdFromUrl || ""
  );

  const [documents, setDocuments] = useState([]);

  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedServiceData = useMemo(() => {
    return services.find(
      (service) =>
        String(service.service_id) === String(selectedService)
    );
  }, [services, selectedService]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchServices();
    fetchDocuments();
  }, [userId, navigate]);

  const fetchServices = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/government-services`
      );

      if (!response.ok) {
        throw new Error("Failed to load government services");
      }

      const data = await response.json();

      setServices(
        Array.isArray(data)
          ? data
          : data.services || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load uploaded documents");
      }

      const data = await response.json();

      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const getRequiredDocuments = () => {
    if (!selectedServiceData?.required_documents) {
      return [];
    }

    return selectedServiceData.required_documents
      .split(",")
      .map((doc) => doc.trim())
      .filter(Boolean);
  };

  const requiredDocuments = getRequiredDocuments();

  const getDocumentStatus = (requiredName) => {
    const uploaded = documents.find(
      (doc) =>
        String(doc.service_id) === String(selectedService) &&
        doc.document_name?.toLowerCase() ===
          requiredName.toLowerCase()
    );

    return uploaded || null;
  };

  const handleUpload = async (requiredDocumentName = "") => {
    setMessage("");
    setError("");

    const finalDocumentName =
      requiredDocumentName || documentName.trim();

    if (!selectedService) {
      setError("Please select a government service.");
      return;
    }

    if (!finalDocumentName) {
      setError("Please provide a document name.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("user_id", userId);
      formData.append("service_id", selectedService);
      formData.append(
        "document_name",
        finalDocumentName
      );
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Document upload failed"
        );
      }

      setMessage(
        `${finalDocumentName} uploaded successfully.`
      );

      setDocumentName("");
      setSelectedFile(null);

      const input = document.getElementById(
        "document-file"
      );

      if (input) {
        input.value = "";
      }

      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading document verification...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-[#0b101b] lg:flex lg:flex-col">

        <div className="border-b border-white/10 px-6 py-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xl font-bold tracking-tight"
          >
            Citizen<span className="text-indigo-400">AI</span>
          </button>

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
              active
              onClick={() => navigate("/documents")}
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

          {/* Header */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-indigo-400">
              DOCUMENT SERVICES
            </p>

            <h1 className="text-3xl font-bold">
              Document Verification
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Upload the documents required for a government
              service and track their verification status.
            </p>
          </div>

          {/* Alerts */}
          {message && (
            <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Service selector */}
          <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6">

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Government Service
            </label>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
            >
              <option value="">
                Select a government service
              </option>

              {services.map((service) => (
                <option
                  key={service.service_id}
                  value={service.service_id}
                >
                  {service.service_name}
                </option>
              ))}
            </select>

            {selectedServiceData && (
              <div className="mt-5 rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-4">
                <p className="text-sm font-semibold text-indigo-300">
                  {selectedServiceData.service_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedServiceData.department ||
                    "Government Department"}
                </p>
              </div>
            )}
          </section>

          {/* Required Documents */}
          {selectedService && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-[#111c2e] p-6">

              <div>
                <h2 className="text-xl font-semibold">
                  Required Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload each document required for this service.
                </p>
              </div>

              {requiredDocuments.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
                  No required document information is available
                  for this service.
                </div>
              ) : (
                <div className="mt-5 space-y-4">

                  {requiredDocuments.map(
                    (requiredDocument) => {
                      const uploaded =
                        getDocumentStatus(
                          requiredDocument
                        );

                      return (
                        <div
                          key={requiredDocument}
                          className="rounded-xl border border-white/10 bg-[#0b1220] p-5"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                            <div>
                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                  📄
                                </div>

                                <div>
                                  <h3 className="text-sm font-semibold text-white">
                                    {requiredDocument}
                                  </h3>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Required document
                                  </p>
                                </div>
                              </div>
                            </div>

                            {uploaded ? (
                              <span
                                className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${
                                  uploaded.verification_status ===
                                  "Verified"
                                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                                    : uploaded.verification_status ===
                                      "Rejected"
                                    ? "border-red-400/20 bg-red-400/10 text-red-400"
                                    : "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                                }`}
                              >
                                {uploaded.verification_status}
                              </span>
                            ) : (
                              <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-500">
                                Not Uploaded
                              </span>
                            )}
                          </div>

                          {!uploaded && (
                            <div className="mt-5 border-t border-white/10 pt-5">

                              <input
                                id={`file-${requiredDocument}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  setDocumentName(
                                    requiredDocument
                                  );
                                  setSelectedFile(
                                    e.target.files?.[0] ||
                                      null
                                  );
                                }}
                                className="w-full rounded-xl border border-white/10 bg-[#111c2e] px-3 py-3 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-4 file:py-2 file:text-sm file:text-indigo-300"
                              />

                              <button
                                onClick={() =>
                                  handleUpload(
                                    requiredDocument
                                  )
                                }
                                disabled={
                                  uploading ||
                                  documentName !==
                                    requiredDocument ||
                                  !selectedFile
                                }
                                className="mt-3 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {uploading
                                  ? "Uploading..."
                                  : "Upload Document"}
                              </button>
                            </div>
                          )}

                          {uploaded &&
                            uploaded.file_path && (
                              <div className="mt-4 border-t border-white/10 pt-4">
                                <a
                                  href={`${API_BASE_URL}/${uploaded.file_path.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                  View Uploaded Document →
                                </a>
                              </div>
                            )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}

          {/* All uploaded documents */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#111c2e] p-6">

            <div>
              <h2 className="text-xl font-semibold">
                My Uploaded Documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Documents uploaded across your government services.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">

                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">
                        Document
                      </th>

                      <th className="px-4 py-3">
                        Service
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {documents.map((document) => (
                      <tr
                        key={document.document_id}
                        className="border-b border-white/5"
                      >
                        <td className="px-4 py-4 text-sm text-slate-300">
                          {document.document_name}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {document.service_name}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              document.verification_status ===
                              "Verified"
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                                : document.verification_status ===
                                  "Rejected"
                                ? "border-red-400/20 bg-red-400/10 text-red-400"
                                : "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                            }`}
                          >
                            {document.verification_status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {document.file_path && (
                            <a
                              href={`${API_BASE_URL}/${document.file_path.replace(
                                /\\/g,
                                "/"
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-indigo-400 hover:text-indigo-300"
                            >
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ================= SIDEBAR ================= */

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

export default DocumentVerification;