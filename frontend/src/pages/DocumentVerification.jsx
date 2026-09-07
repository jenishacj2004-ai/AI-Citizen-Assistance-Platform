import { useEffect, useState } from "react";

function DocumentVerification() {
  const userId = localStorage.getItem("user_id");

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [replaceDocument, setReplaceDocument] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [replacing, setReplacing] = useState(false);
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/documents/${userId}`
      );

      const data = await response.json();

      if (data.status === "success") {
        setDocuments(data.documents);
      }

    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadDocuments();
    }
  }, [userId]);

  // ==========================================
  // VIEW VERIFICATION DETAILS
  // ==========================================

  const handleViewDetails = (document) => {
    setSelectedDocument(document);
    setShowDetails(true);
  };

  // ==========================================
  // OPEN REPLACE
  // ==========================================

  const handleReplaceClick = (document) => {
    setReplaceDocument(document);
    setSelectedFile(null);
    setMessage("");
  };

  // ==========================================
  // REPLACE DOCUMENT
  // ==========================================

  const handleReplaceSubmit = async () => {

    if (!selectedFile) {
      setMessage("Please select a document.");
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
        selectedFile
      );

      const response = await fetch(
        `http://127.0.0.1:8000/documents/${replaceDocument.document_id}/replace`,
        {
          method: "PUT",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Document replacement failed"
        );
      }

      if (data.success) {

        setMessage(
          `Document replaced successfully. Status: ${data.verification_status}`
        );

        setReplaceDocument(null);
        setSelectedFile(null);

        // Reload documents
        await loadDocuments();
      }

    } catch (error) {

      console.error(error);

      setMessage(
        error.message
      );

    } finally {

      setReplacing(false);
    }
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (status) => {

    if (status === "Verified") {
      return "bg-green-500/10 text-green-400 border-green-500/30";
    }

    if (status === "Rejected") {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    }

    if (status === "Processing") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    }

    return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-8">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold">
            Document Verification
          </h1>

          <p className="mt-2 text-slate-400">
            View the verification status of your submitted documents.
          </p>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="rounded-xl border border-white/10 bg-[#111c30] p-8 text-center text-slate-400">
            Loading documents...
          </div>
        )}


        {/* NO DOCUMENTS */}

        {!loading && documents.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-[#111c30] p-8 text-center">

            <p className="text-slate-400">
              No documents uploaded yet.
            </p>

          </div>
        )}


        {/* DOCUMENT LIST */}

        <div className="space-y-5">

          {documents.map((document) => (

            <div
              key={document.document_id}
              className="rounded-2xl border border-white/10 bg-[#111c30] p-6"
            >

              {/* TOP */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-xl">
                    📄
                  </div>

                  <div>

                    <h2 className="font-semibold text-lg">
                      {document.document_name}
                    </h2>

                    <p className="text-sm text-slate-500">
                      {document.service_name}
                    </p>

                  </div>

                </div>


                {/* STATUS */}

                <span
                  className={`rounded-full border px-4 py-2 text-sm ${getStatusStyle(
                    document.verification_status
                  )}`}
                >
                  {document.verification_status}
                </span>

              </div>


              {/* DIVIDER */}

              <div className="my-5 border-t border-white/10" />


              {/* ACTIONS */}

              <div className="flex flex-wrap gap-3">

                <button
                  onClick={() =>
                    handleViewDetails(document)
                  }
                  className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-500/20"
                >
                  View Verification Details →
                </button>


                {/* REPLACE ONLY FOR REJECTED */}

                {document.verification_status === "Rejected" && (

                  <button
                    onClick={() =>
                      handleReplaceClick(document)
                    }
                    className="rounded-lg border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300 hover:bg-orange-500/20"
                  >
                    Upload Another Document
                  </button>

                )}

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* ================================================= */}
      {/* VERIFICATION DETAILS MODAL */}
      {/* ================================================= */}

      {showDetails && selectedDocument && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111c30] p-6 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Verification Details
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {selectedDocument.document_name}
                </p>

              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="text-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>

            </div>


            {/* STATUS */}

            <div className="mt-6">

              <span
                className={`rounded-full border px-4 py-2 text-sm ${getStatusStyle(
                  selectedDocument.verification_status
                )}`}
              >
                {selectedDocument.verification_status}
              </span>

            </div>


            {/* OCR STATUS */}

            <div className="mt-6 rounded-xl bg-[#0b1220] p-4">

              <p className="text-xs uppercase tracking-wider text-slate-500">
                OCR Status
              </p>

              <p className="mt-1">
                {selectedDocument.ocr_status || "Not Available"}
              </p>

            </div>


            {/* EXTRACTED NAME */}

            <div className="mt-4">

              <p className="text-xs uppercase tracking-wider text-slate-500">
                Extracted Name
              </p>

              <p className="mt-1">
                {selectedDocument.extracted_name || "Not detected"}
              </p>

            </div>


            {/* DOB */}

            <div className="mt-4">

              <p className="text-xs uppercase tracking-wider text-slate-500">
                Extracted DOB
              </p>

              <p className="mt-1">
                {selectedDocument.extracted_dob || "Not detected"}
              </p>

            </div>


            {/* ADDRESS */}

            <div className="mt-4">

              <p className="text-xs uppercase tracking-wider text-slate-500">
                Extracted Address
              </p>

              <p className="mt-1 text-slate-300">
                {selectedDocument.extracted_address ||
                  "Not detected"}
              </p>

            </div>


            {/* REASON */}

            {selectedDocument.verification_reason && (

              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">

                <p className="text-xs uppercase tracking-wider text-red-400">
                  Verification Reason
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedDocument.verification_reason}
                </p>

              </div>

            )}


            {/* CLOSE */}

            <button
              onClick={() => setShowDetails(false)}
              className="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium hover:bg-indigo-600"
            >
              Close
            </button>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* REPLACE DOCUMENT MODAL */}
      {/* ================================================= */}

      {replaceDocument && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111c30] p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Replace Document
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Upload a new {replaceDocument.document_name}
                </p>

              </div>

              <button
                onClick={() => setReplaceDocument(null)}
                className="text-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>

            </div>


            {/* WARNING */}

            <div className="mt-5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">

              <p className="text-sm text-orange-300">
                Your new document will be processed using OCR
                and verified again.
              </p>

            </div>


            {/* FILE */}

            <div className="mt-6">

              <label className="mb-2 block text-sm text-slate-400">
                Select new document
              </label>

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setSelectedFile(e.target.files[0])
                }
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] p-3 text-sm"
              />

            </div>


            {/* MESSAGE */}

            {message && (

              <div className="mt-4 rounded-lg bg-[#0b1220] p-3 text-sm text-slate-300">
                {message}
              </div>

            )}


            {/* BUTTONS */}

            <div className="mt-6 flex gap-3">

              <button
                onClick={() => setReplaceDocument(null)}
                className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-slate-400 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={handleReplaceSubmit}
                disabled={replacing}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-3 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {replacing
                  ? "Processing..."
                  : "Upload & Verify"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default DocumentVerification;