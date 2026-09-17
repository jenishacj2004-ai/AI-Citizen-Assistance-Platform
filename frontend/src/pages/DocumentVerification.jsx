import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function DocumentVerification() {
  const navigate = useNavigate();

  // =========================================================
  // USER
  // =========================================================

  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "Citizen";

  // =========================================================
  // STATE
  // =========================================================

  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [uploadingDocument, setUploadingDocument] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState({});

  const [uploadMessage, setUploadMessage] = useState("");

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  const [replaceDocument, setReplaceDocument] = useState(null);

  const [replaceFile, setReplaceFile] = useState(null);

  const [replacing, setReplacing] = useState(false);

  const [message, setMessage] = useState("");

  // =========================================================
  // DOCUMENT TYPES
  // =========================================================
  //
  // IMPORTANT:
  // service_id is currently required by your backend.
  //
  // Change these IDs according to your government_services
  // table.
  //
  // =========================================================

  const documentTypes = [
    {
      name: "Income Certificate",
      description:
        "Proof of annual income required for scholarships, schemes and financial assistance.",
      service_id: 1,
    },
    {
      name: "Ration Card",
      description:
        "Family identification and household document used for various government services.",
      service_id: 1,
    },
    {
      name: "Address Proof",
      description:
        "Document used to verify your residential address.",
      service_id: 1,
    },
    {
      name: "Caste Certificate",
      description:
        "Certificate used for category-based government benefits and schemes.",
      service_id: 1,
    },
    {
      name: "Aadhaar Card",
      description:
        "Identity document used for citizen verification.",
      service_id: 1,
    },
    {
      name: "Other Supporting Document",
      description:
        "Upload any other document required for your application.",
      service_id: 1,
    },
  ];

  // =========================================================
  // LOAD EXISTING DOCUMENTS
  // =========================================================

  const loadDocuments = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/documents/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load documents."
        );
      }

      if (data.status === "success") {
        setDocuments(data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error(
        "Error loading documents:",
        error
      );

      setUploadMessage(
        error.message || "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  // =========================================================
  // FIND EXISTING DOCUMENT
  // =========================================================

  const getExistingDocument = (documentName) => {
    return documents.find(
      (document) =>
        String(document.document_name)
          .trim()
          .toLowerCase() ===
        String(documentName)
          .trim()
          .toLowerCase()
    );
  };

  // =========================================================
  // FILE SELECT
  // =========================================================

  const handleFileSelect = (documentName, file) => {
    if (!file) {
      return;
    }

    // PDF ONLY
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadMessage(
        "Please select a PDF file only."
      );

      setSelectedFiles((prev) => ({
        ...prev,
        [documentName]: null,
      }));

      return;
    }

    // Optional size validation
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setUploadMessage(
        "PDF file size must be less than 10 MB."
      );

      setSelectedFiles((prev) => ({
        ...prev,
        [documentName]: null,
      }));

      return;
    }

    setUploadMessage("");

    setSelectedFiles((prev) => ({
      ...prev,
      [documentName]: file,
    }));
  };

  // =========================================================
  // FORMAT FILE SIZE
  // =========================================================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // =========================================================
  // UPLOAD DOCUMENT
  // =========================================================

  const handleUpload = async (documentType) => {
    const file =
      selectedFiles[documentType.name];

    if (!file) {
      setUploadMessage(
        `Please select the ${documentType.name} PDF.`
      );
      return;
    }

    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      setUploadingDocument(
        documentType.name
      );

      setUploadMessage("");

      const formData = new FormData();

      formData.append(
        "user_id",
        userId
      );

      formData.append(
        "service_id",
        documentType.service_id
      );

      formData.append(
        "document_name",
        documentType.name
      );

      formData.append(
        "file",
        file
      );

      const response = await fetch(
        "http://127.0.0.1:8000/documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Document upload failed."
        );
      }

      if (data.success) {
        setUploadMessage(
          `${documentType.name} uploaded and verified successfully.`
        );

        setSelectedFiles((prev) => ({
          ...prev,
          [documentType.name]: null,
        }));

        await loadDocuments();
      } else {
        setUploadMessage(
          data.message ||
            "Document processing failed."
        );

        await loadDocuments();
      }
    } catch (error) {
      console.error(
        "Upload Error:",
        error
      );

      setUploadMessage(
        error.message ||
          "Document upload failed."
      );
    } finally {
      setUploadingDocument(null);
    }
  };

  // =========================================================
  // VIEW DETAILS
  // =========================================================

  const handleViewDetails = (document) => {
    setSelectedDocument(document);
    setShowDetails(true);
  };

  // =========================================================
  // OPEN REPLACE
  // =========================================================

  const handleReplaceClick = (document) => {
    setReplaceDocument(document);
    setReplaceFile(null);
    setMessage("");
  };

  // =========================================================
  // REPLACE FILE SELECT
  // =========================================================

  const handleReplaceFile = (file) => {
    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage(
        "Please select a PDF file only."
      );

      setReplaceFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        "PDF file size must be less than 10 MB."
      );

      setReplaceFile(null);
      return;
    }

    setMessage("");
    setReplaceFile(file);
  };

  // =========================================================
  // REPLACE DOCUMENT
  // =========================================================

  const handleReplaceSubmit = async () => {
    if (!replaceFile) {
      setMessage(
        "Please select a new PDF document."
      );
      return;
    }

    if (!replaceDocument) {
      return;
    }

    try {
      setReplacing(true);
      setMessage("");

      const formData = new FormData();

      formData.append(
        "user_id",
        userId
      );

      formData.append(
        "document_name",
        replaceDocument.document_name
      );

      formData.append(
        "file",
        replaceFile
      );

      const response = await fetch(
        `http://127.0.0.1:8000/documents/${replaceDocument.document_id}/replace`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Document replacement failed."
        );
      }

      if (data.success) {
        setMessage(
          `Document replaced successfully. Status: ${
            data.verification_status
          }`
        );

        setReplaceDocument(null);
        setReplaceFile(null);

        await loadDocuments();
      } else {
        setMessage(
          data.message ||
            "Document replacement failed."
        );
      }
    } catch (error) {
      console.error(
        "Replacement Error:",
        error
      );

      setMessage(
        error.message ||
          "Document replacement failed."
      );
    } finally {
      setReplacing(false);
    }
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    const value =
      String(status || "")
        .toLowerCase();

    if (value === "verified") {
      return {
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        icon: "✓",
      };
    }

    if (value === "rejected") {
      return {
        badge:
          "border-red-400/20 bg-red-400/10 text-red-300",
        icon: "!",
      };
    }

    if (
      value === "processing" ||
      value === "pending"
    ) {
      return {
        badge:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
        icon: "⏳",
      };
    }

    return {
      badge:
        "border-slate-400/20 bg-slate-400/10 text-slate-300",
      icon: "?",
    };
  };

  // =========================================================
  // SIDEBAR
  // =========================================================

  const SidebarItem = ({
    icon,
    label,
    active = false,
    danger = false,
    onClick,
  }) => {
    return (
      <button
        onClick={onClick}
        className={`
          group flex w-full
          items-center gap-3
          rounded-lg
          px-3 py-3
          text-left text-sm
          transition duration-300

          ${
            active
              ? "border-l-2 border-indigo-400 bg-indigo-400/10 text-indigo-300"
              : danger
              ? "text-red-400 hover:bg-red-400/10"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }
        `}
      >
        <span className="w-5 text-center">
          {icon}
        </span>

        <span>
          {label}
        </span>
      </button>
    );
  };

  // =========================================================
  // DOCUMENT CARD
  // =========================================================

  const DocumentCard = ({
    documentType,
  }) => {
    const existingDocument =
      getExistingDocument(
        documentType.name
      );

    const selectedFile =
      selectedFiles[
        documentType.name
      ];

    const isUploading =
      uploadingDocument ===
      documentType.name;

    // -------------------------------------------------------
    // EXISTING DOCUMENT
    // -------------------------------------------------------

    if (existingDocument) {
      const statusStyle =
        getStatusStyle(
          existingDocument.verification_status
        );

      return (
        <article
          className="
            rounded-2xl
            border border-white/10
            bg-[#141d2e]
            p-6
            transition-all duration-300
            hover:border-indigo-400/20
            hover:shadow-xl
            hover:shadow-black/10
          "
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="
                  flex h-12 w-12
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-indigo-500/10
                  text-xl
                  text-indigo-300
                "
              >
                📄
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {documentType.name}
                </h3>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  {documentType.description}
                </p>
              </div>
            </div>

            <span
              className={`
                w-fit
                rounded-full
                border
                px-3 py-1.5
                text-xs font-semibold
                ${statusStyle.badge}
              `}
            >
              {statusStyle.icon}{" "}
              {existingDocument.verification_status ||
                "Pending"}
            </span>
          </div>

          <div className="my-5 border-t border-white/10" />

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                OCR Status
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {existingDocument.ocr_status ||
                  "Not Available"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                Document
              </p>

              <p className="mt-1 text-sm text-slate-300">
                PDF
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                Uploaded
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {existingDocument.uploaded_at
                  ? new Date(
                      existingDocument.uploaded_at
                    ).toLocaleDateString(
                      "en-IN"
                    )
                  : "Available"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() =>
                handleViewDetails(
                  existingDocument
                )
              }
              className="
                rounded-lg
                border border-indigo-400/20
                bg-indigo-500/10
                px-4 py-2.5
                text-sm font-medium
                text-indigo-300
                transition
                hover:bg-indigo-500/20
              "
            >
              View Verification Details →
            </button>

            {existingDocument.verification_status ===
              "Rejected" && (
              <button
                onClick={() =>
                  handleReplaceClick(
                    existingDocument
                  )
                }
                className="
                  rounded-lg
                  border border-orange-400/20
                  bg-orange-500/10
                  px-4 py-2.5
                  text-sm font-medium
                  text-orange-300
                  transition
                  hover:bg-orange-500/20
                "
              >
                Upload Another PDF
              </button>
            )}
          </div>
        </article>
      );
    }

    // -------------------------------------------------------
    // NOT UPLOADED
    // -------------------------------------------------------

    return (
      <article
        className="
          rounded-2xl
          border border-white/10
          bg-[#141d2e]
          p-6
          transition-all duration-300
          hover:border-indigo-400/20
        "
      >
        <div className="flex items-start gap-4">
          <div
            className="
              flex h-12 w-12
              shrink-0
              items-center justify-center
              rounded-xl
              bg-indigo-500/10
              text-xl
              text-indigo-300
            "
          >
            📄
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {documentType.name}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {documentType.description}
            </p>
          </div>
        </div>

        <div
          className="
            mt-5
            rounded-xl
            border border-dashed
            border-white/10
            bg-[#0f1727]
            p-5
          "
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-xl">
              ↑
            </div>

            <p className="mt-3 text-sm font-medium text-slate-300">
              Upload {documentType.name}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              PDF files only • Maximum 10 MB
            </p>
          </div>

          <div className="mt-5">
            <label
              className="
                flex cursor-pointer
                items-center justify-center
                rounded-lg
                border border-white/10
                bg-white/[0.03]
                px-4 py-3
                text-sm
                text-slate-400
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              <span>
                {selectedFile
                  ? "Change PDF"
                  : "Choose PDF File"}
              </span>

              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(
                    documentType.name,
                    e.target.files[0]
                  )
                }
              />
            </label>
          </div>

          {selectedFile && (
            <div
              className="
                mt-4
                flex items-center
                justify-between
                gap-3
                rounded-lg
                border border-indigo-400/10
                bg-indigo-400/5
                px-4 py-3
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-red-300">
                  PDF
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-300">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-slate-600">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedFiles(
                    (prev) => ({
                      ...prev,
                      [documentType.name]:
                        null,
                    })
                  )
                }
                className="shrink-0 text-xs text-slate-500 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              handleUpload(documentType)
            }
            disabled={
              isUploading ||
              !selectedFile
            }
            className="
              mt-4
              flex w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-indigo-500
              px-4 py-3
              text-sm font-semibold
              text-white
              transition
              hover:bg-indigo-400
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isUploading ? (
              <>
                <span>⏳</span>
                Processing PDF...
              </>
            ) : (
              <>
                <span>✓</span>
                Upload & Verify
              </>
            )}
          </button>
        </div>
      </article>
    );
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-white">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="
          fixed left-0 top-0 z-30
          hidden h-screen w-64
          border-r border-white/10
          bg-[#0b101b]
          lg:flex lg:flex-col
        "
      >
        {/* LOGO */}

        <div className="border-b border-white/10 px-6 py-5">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
          >
            Citizen
            <span className="text-indigo-400">
              AI
            </span>
          </Link>

          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Digital Citizenship
          </p>
        </div>

        {/* NAVIGATION */}

        <div className="flex-1 px-4 py-6">

          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="▦"
              label="Overview"
              onClick={() =>
                navigate("/dashboard")
              }
            />

            <SidebarItem
              icon="⌕"
              label="Government Services"
              onClick={() =>
                navigate("/services")
              }
            />

            <SidebarItem
              icon="✓"
              label="Eligibility Checking"
              onClick={() =>
                navigate("/eligibility")
              }
            />

            <SidebarItem
              icon="✦"
              label="AI Recommendation"
              onClick={() =>
                navigate("/recommendation")
              }
            />

            <SidebarItem
              icon="▧"
              label="Documents"
              active
              onClick={() =>
                navigate("/documents")
              }
            />

            <SidebarItem
              icon="◉"
              label="Notifications"
              onClick={() => {}}
            />

          </div>

          {/* ACCOUNT */}

          <p className="px-3 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Account
          </p>

          <div className="space-y-2">

            <SidebarItem
              icon="👤"
              label="Profile"
              onClick={() =>
                navigate("/profile")
              }
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
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            />

          </div>
        </div>

        {/* QUICK ACTION */}

        <div className="border-t border-white/10 p-4">

          <button
            onClick={() =>
              navigate("/eligibility")
            }
            className="
              w-full
              rounded-xl
              border border-emerald-400/20
              bg-emerald-400/10
              px-4 py-3
              text-sm font-semibold
              text-emerald-300
              transition
              hover:bg-emerald-400/15
            "
          >
            Check Eligibility
          </button>

        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="min-h-screen lg:ml-64">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header
          className="
            sticky top-0 z-20
            border-b border-white/10
            bg-[#0d1422]/90
            backdrop-blur-xl
          "
        >
          <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Document Management
              </p>

              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                Document Verification
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

              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-indigo-500
                  to-purple-500
                  font-bold
                "
              >
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </div>

            </div>

          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="px-6 py-8 lg:px-8">

          {/* INTRO */}

          <section className="mb-8">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-12 w-12
                  items-center justify-center
                  rounded-2xl
                  bg-indigo-500/10
                  text-2xl
                  text-indigo-300
                "
              >
                ▧
              </div>

              <div>

                <h2 className="text-3xl font-bold text-slate-100">
                  Your Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload your required documents as PDF files.
                  Our system will extract the information and
                  verify it against your citizen profile.
                </p>

              </div>

            </div>

          </section>

          {/* INFORMATION BOX */}

          <section
            className="
              mb-8
              rounded-2xl
              border border-indigo-400/10
              bg-indigo-400/[0.05]
              p-5
            "
          >
            <div className="flex items-start gap-4">

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-indigo-400/10
                  text-indigo-300
                "
              >
                ✦
              </div>

              <div>

                <p className="text-sm font-semibold text-indigo-300">
                  AI-Powered PDF Verification
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Upload a clear PDF document. The system
                  extracts the text from the PDF and analyses
                  the document information before comparing it
                  with your citizen profile.
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Supported format: PDF • Maximum file size: 10 MB
                </p>

              </div>

            </div>
          </section>

          {/* MESSAGE */}

          {uploadMessage && (
            <div
              className="
                mb-6
                rounded-xl
                border border-indigo-400/10
                bg-indigo-400/5
                px-5 py-4
                text-sm text-slate-300
              "
            >
              {uploadMessage}
            </div>
          )}

          {/* LOADING */}

          {loading ? (

            <div className="grid gap-5 xl:grid-cols-2">

              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="
                    h-72
                    animate-pulse
                    rounded-2xl
                    border border-white/10
                    bg-[#141d2e]
                  "
                />
              ))}

            </div>

          ) : (

            <section>

              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                    Document Center
                  </p>

                  <h3 className="mt-1 text-2xl font-semibold text-slate-100">
                    Upload & Verify Documents
                  </h3>

                </div>

                <p className="text-xs text-slate-600">
                  {documents.length} document
                  {documents.length !== 1
                    ? "s"
                    : ""}{" "}
                  currently submitted
                </p>

              </div>

              <div className="grid gap-5 xl:grid-cols-2">

                {documentTypes.map(
                  (documentType) => (
                    <DocumentCard
                      key={
                        documentType.name
                      }
                      documentType={
                        documentType
                      }
                    />
                  )
                )}

              </div>

            </section>

          )}

        </main>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer
          className="
            border-t border-white/10
            px-6 py-6
            text-center
            text-xs text-slate-600
            lg:px-8
          "
        >
          AI-Powered Citizen Assistance Platform for E-Governance
        </footer>

      </div>

      {/* =====================================================
          VERIFICATION DETAILS MODAL
      ===================================================== */}

      {showDetails &&
        selectedDocument && (

          <div
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/70
              px-4
              py-6
            "
          >

            <div
              className="
                max-h-[90vh]
                w-full max-w-2xl
                overflow-y-auto
                rounded-2xl
                border border-white/10
                bg-[#111c30]
                p-6
                shadow-2xl
              "
            >

              {/* HEADER */}

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                    Verification Report
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    {selectedDocument.document_name}
                  </h2>

                </div>

                <button
                  onClick={() =>
                    setShowDetails(false)
                  }
                  className="
                    text-xl
                    text-slate-500
                    hover:text-white
                  "
                >
                  ✕
                </button>

              </div>

              {/* STATUS */}

              <div className="mt-6">

                {(() => {
                  const style =
                    getStatusStyle(
                      selectedDocument.verification_status
                    );

                  return (
                    <span
                      className={`
                        inline-flex
                        rounded-full
                        border
                        px-4 py-2
                        text-sm font-semibold
                        ${style.badge}
                      `}
                    >
                      {style.icon}{" "}
                      {selectedDocument.verification_status ||
                        "Pending"}
                    </span>
                  );
                })()}

              </div>

              {/* OCR */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <DetailBox
                  label="OCR Status"
                  value={
                    selectedDocument.ocr_status
                  }
                />

                <DetailBox
                  label="Document Type"
                  value="PDF"
                />

                <DetailBox
                  label="Extracted Name"
                  value={
                    selectedDocument.extracted_name
                  }
                />

                <DetailBox
                  label="Extracted DOB"
                  value={
                    selectedDocument.extracted_dob
                  }
                />

              </div>

              {/* ADDRESS */}

              <div className="mt-4">

                <DetailBox
                  label="Extracted Address"
                  value={
                    selectedDocument.extracted_address
                  }
                />

              </div>

              {/* EXTRACTED TEXT */}

              {selectedDocument.extracted_text && (

                <div className="mt-5">

                  <p className="mb-2 text-xs uppercase tracking-[0.13em] text-slate-500">
                    Extracted PDF Text
                  </p>

                  <div
                    className="
                      max-h-48
                      overflow-y-auto
                      rounded-xl
                      border border-white/5
                      bg-[#0b1220]
                      p-4
                      text-sm
                      leading-6
                      text-slate-400
                    "
                  >
                    {selectedDocument.extracted_text}
                  </div>

                </div>

              )}

              {/* REASON */}

              {selectedDocument.verification_reason && (

                <div
                  className="
                    mt-5
                    rounded-xl
                    border border-amber-400/15
                    bg-amber-400/5
                    p-4
                  "
                >

                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-amber-300">
                    Verification Reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedDocument.verification_reason}
                  </p>

                </div>

              )}

              {/* CLOSE */}

              <button
                onClick={() =>
                  setShowDetails(false)
                }
                className="
                  mt-6
                  w-full
                  rounded-lg
                  bg-indigo-500
                  px-4 py-3
                  text-sm font-semibold
                  text-white
                  hover:bg-indigo-400
                "
              >
                Close
              </button>

            </div>

          </div>

        )}

      {/* =====================================================
          REPLACE MODAL
      ===================================================== */}

      {replaceDocument && (

        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/70
            px-4
          "
        >

          <div
            className="
              w-full max-w-lg
              rounded-2xl
              border border-white/10
              bg-[#111c30]
              p-6
              shadow-2xl
            "
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-400">
                  Replace Document
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Upload New PDF
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {replaceDocument.document_name}
                </p>

              </div>

              <button
                onClick={() =>
                  setReplaceDocument(null)
                }
                className="text-xl text-slate-500 hover:text-white"
              >
                ✕
              </button>

            </div>

            {/* WARNING */}

            <div
              className="
                mt-5
                rounded-xl
                border border-orange-400/15
                bg-orange-400/5
                p-4
              "
            >
              <p className="text-sm leading-6 text-orange-300">
                The new PDF will be processed again.
                Text will be extracted and the document
                will be verified against your profile.
              </p>
            </div>

            {/* FILE */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Select PDF
              </label>

              <label
                className="
                  flex cursor-pointer
                  items-center justify-center
                  rounded-xl
                  border border-dashed
                  border-white/10
                  bg-[#0b1220]
                  px-4 py-8
                  text-sm
                  text-slate-500
                  transition
                  hover:border-indigo-400/30
                  hover:text-slate-300
                "
              >
                <div className="text-center">

                  <div className="text-2xl">
                    📄
                  </div>

                  <p className="mt-2">
                    {replaceFile
                      ? replaceFile.name
                      : "Choose PDF file"}
                  </p>

                  {replaceFile && (
                    <p className="mt-1 text-xs text-slate-600">
                      {formatFileSize(
                        replaceFile.size
                      )}
                    </p>
                  )}

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleReplaceFile(
                        e.target.files[0]
                      )
                    }
                  />

                </div>
              </label>

            </div>

            {/* MESSAGE */}

            {message && (

              <div
                className="
                  mt-4
                  rounded-lg
                  border border-white/5
                  bg-[#0b1220]
                  p-3
                  text-sm
                  text-slate-300
                "
              >
                {message}
              </div>

            )}

            {/* BUTTONS */}

            <div className="mt-6 flex gap-3">

              <button
                onClick={() => {
                  setReplaceDocument(null);
                  setReplaceFile(null);
                  setMessage("");
                }}
                className="
                  flex-1
                  rounded-lg
                  border border-white/10
                  px-4 py-3
                  text-sm
                  text-slate-400
                  hover:bg-white/5
                "
              >
                Cancel
              </button>

              <button
                onClick={handleReplaceSubmit}
                disabled={
                  replacing ||
                  !replaceFile
                }
                className="
                  flex-1
                  rounded-lg
                  bg-orange-500
                  px-4 py-3
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-orange-400
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {replacing
                  ? "Processing PDF..."
                  : "Upload & Verify"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// =========================================================
// DETAIL BOX
// =========================================================

function DetailBox({ label, value }) {
  return (
    <div
      className="
        rounded-xl
        border border-white/5
        bg-[#0b1220]
        p-4
      "
    >
      <p className="text-[10px] uppercase tracking-[0.13em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-300">
        {value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
          ? String(value)
          : "Not detected"}
      </p>
    </div>
  );
}

export default DocumentVerification;