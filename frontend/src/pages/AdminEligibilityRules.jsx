import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminEligibilityRules() {
  const navigate = useNavigate();
  const { serviceId } = useParams();

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("user_role");

  const [selectedServiceId, setSelectedServiceId] = useState(
    serviceId ? Number(serviceId) : 12
  );
  const [allServices, setAllServices] = useState([]);
  const [rules, setRules] = useState([]);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState(null);

  const [form, setForm] = useState({
    rule_type: "REQUIREMENT",
    field_name: "",
    operator: "==",
    rule_value: "",
    logical_group: 1,
    description: "",
  });

  // Admin protection
  useEffect(() => {
    if (role !== "Admin") {
      navigate("/dashboard");
      return;
    }

    fetchAllServices();
  }, [role, navigate]);

  useEffect(() => {
    if (serviceId) {
      setSelectedServiceId(Number(serviceId));
    }
  }, [serviceId]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchRulesForService(selectedServiceId);
    }
  }, [selectedServiceId]);

  // Fetch all services for the dropdown
  const fetchAllServices = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/services?user_id=${userId}`
      );
      const data = await response.json();
      if (response.ok) {
        const servicesList = data.services || [];
        setAllServices(servicesList);
        const current = servicesList.find(
          (s) => s.service_id === Number(selectedServiceId)
        );
        setService(current || null);
      }
    } catch (error) {
      console.error("Failed to load services list", error);
    }
  };

  // Fetch rules for the selected service
  const fetchRulesForService = async (svcId) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/eligibility-rules?user_id=${userId}&service_id=${svcId}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to load eligibility rules");
        return;
      }

      // Handle both raw list or { rules: [...] } response format safely
      const allRules = Array.isArray(data) ? data : (data.rules || []);
      const serviceRules = allRules.filter(
        (rule) => rule.service_id === Number(svcId)
      );

      setRules(serviceRules);

      // Also ensure service details are updated
      if (allServices.length > 0) {
        const current = allServices.find(
          (s) => s.service_id === Number(svcId)
        );
        setService(current || null);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // Handle service selector change
  const handleServiceChange = (e) => {
    const newId = Number(e.target.value);
    setSelectedServiceId(newId);
    setEditingRuleId(null);
    resetForm();
    navigate(`/admin/services/${newId}/eligibility-rules`);
  };

  // Handle form changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      rule_type: "REQUIREMENT",
      field_name: "",
      operator: "==",
      rule_value: "",
      logical_group: 1,
      description: "",
    });
    setEditingRuleId(null);
  };

  // Start editing a rule
  const handleEditClick = (rule) => {
    setEditingRuleId(rule.rule_id);
    setForm({
      rule_type: rule.rule_type,
      field_name: rule.field_name,
      operator: rule.operator,
      rule_value: String(rule.rule_value),
      logical_group: rule.logical_group || 1,
      description: rule.description || "",
    });
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  // Save (Add or Update) rule
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!form.field_name || form.rule_value === "") {
      alert("Please enter field name and rule value");
      return;
    }

    try {
      if (editingRuleId) {
        // UPDATE existing rule
        const response = await fetch(
          `${API_URL}/admin/eligibility-rules/${editingRuleId}?user_id=${userId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rule_type: form.rule_type,
              field_name: form.field_name.trim(),
              operator: form.operator,
              rule_value: form.rule_value.trim(),
              logical_group: Number(form.logical_group),
              description: form.description ? form.description.trim() : null,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.detail || "Failed to update eligibility rule");
          return;
        }

        alert("Eligibility rule updated successfully");
        resetForm();
        fetchRulesForService(selectedServiceId);

      } else {
        // CREATE new rule
        const response = await fetch(
          `${API_URL}/admin/eligibility-rules?user_id=${userId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              service_id: Number(selectedServiceId),
              rule_type: form.rule_type,
              field_name: form.field_name.trim(),
              operator: form.operator,
              rule_value: form.rule_value.trim(),
              logical_group: Number(form.logical_group),
              description: form.description ? form.description.trim() : null,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.detail || "Failed to add rule");
          return;
        }

        alert("Eligibility rule added successfully");
        resetForm();
        fetchRulesForService(selectedServiceId);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this eligibility rule?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/eligibility-rules/${ruleId}?user_id=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to delete rule");
        return;
      }

      alert("Eligibility rule deleted successfully");
      if (editingRuleId === ruleId) {
        resetForm();
      }
      fetchRulesForService(selectedServiceId);

    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-gray-700 bg-[#111c30] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Eligibility Rules Management
          </h1>

          <p className="text-sm text-gray-400">
            {service?.service_name || "Government Service"} (ID: {selectedServiceId})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/services")}
            className="rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-700"
          >
            Manage Services
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-700"
          >
            Admin Dashboard
          </button>
        </div>

      </header>

      <main className="p-6">

        {/* Service Selector & Information */}
        <div className="mb-6 rounded-xl border border-gray-700 bg-[#111c30] p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Select Government Service
              </label>

              <select
                value={selectedServiceId}
                onChange={handleServiceChange}
                className="mt-1 rounded-lg border border-gray-600 bg-[#0b1220] px-4 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
              >
                {allServices.map((svc) => (
                  <option key={svc.service_id} value={svc.service_id}>
                    {svc.service_id} - {svc.service_name} ({svc.status})
                  </option>
                ))}
              </select>
            </div>

            {service && (
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    service.status === "Active"
                      ? "bg-green-900/60 text-green-300 border border-green-500/30"
                      : "bg-red-900/60 text-red-300 border border-red-500/30"
                  }`}
                >
                  ● {service.status}
                </span>
                <p className="mt-1 text-sm text-gray-400">
                  Eligibility Mode:{" "}
                  <span className="font-semibold text-white">
                    {service.eligibility_mode || "Rule Based"}
                  </span>
                </p>
              </div>
            )}

          </div>

          {service && (
            <div className="mt-4 border-t border-gray-700/60 pt-4">
              <h2 className="text-xl font-bold text-white">
                {service.service_name}
              </h2>
              <p className="text-sm text-blue-400">
                {service.department}
              </p>
              <p className="mt-2 text-xs text-gray-300 max-w-4xl">
                {service.description}
              </p>
            </div>
          )}

        </div>

        {/* Add / Edit Rule Form */}
        <div
          id="rule-form"
          className={`mb-6 rounded-xl border p-6 transition-all ${
            editingRuleId
              ? "border-amber-500/60 bg-[#162238] shadow-lg shadow-amber-500/5"
              : "border-gray-700 bg-[#111c30]"
          }`}
        >

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingRuleId ? (
                <span className="text-amber-300">
                  ✎ Edit Eligibility Rule #{editingRuleId}
                </span>
              ) : (
                "+ Add Eligibility Rule"
              )}
            </h2>

            {editingRuleId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-500"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleFormSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >

            {/* Rule Type */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Rule Type <span className="text-red-400">*</span>
              </label>

              <select
                name="rule_type"
                value={form.rule_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              >
                <option value="REQUIREMENT">
                  REQUIREMENT (Must be satisfied)
                </option>

                <option value="EXCLUSION">
                  EXCLUSION (Matching disqualifies applicant)
                </option>
              </select>
            </div>

            {/* Field Name */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Field Name <span className="text-red-400">*</span>
              </label>

              <input
                type="text"
                name="field_name"
                value={form.field_name}
                onChange={handleChange}
                placeholder="Example: landholder, aadhaar_verified, income_tax_payer"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Operator <span className="text-red-400">*</span>
              </label>

              <select
                name="operator"
                value={form.operator}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              >
                <option value="==">== (Equals)</option>
                <option value="!=">!= (Not equals)</option>
                <option value=">">&gt; (Greater than)</option>
                <option value=">=">&gt;= (Greater than or equal)</option>
                <option value="<">&lt; (Less than)</option>
                <option value="<=">&lt;= (Less than or equal)</option>
              </select>
            </div>

            {/* Rule Value */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Rule Value <span className="text-red-400">*</span>
              </label>

              <input
                type="text"
                name="rule_value"
                value={form.rule_value}
                onChange={handleChange}
                placeholder="Example: true, false, 10000"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Logical Group */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Logical Group (Default: 1)
              </label>

              <input
                type="number"
                name="logical_group"
                value={form.logical_group}
                onChange={handleChange}
                min="1"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                Rules in the same group are combined with AND. Different requirement groups form alternative paths (OR).
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Description / Question Context
              </label>

              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Official criterion or question explanation"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 md:col-span-2 pt-2">

              <button
                type="submit"
                className={`rounded-lg px-6 py-2.5 font-medium text-white transition ${
                  editingRuleId
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {editingRuleId ? "Save Changes" : "+ Add Rule"}
              </button>

              {editingRuleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-gray-600 px-5 py-2.5 font-medium text-white hover:bg-gray-500"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </div>

        {/* Existing Rules */}
        <div className="rounded-xl border border-gray-700 bg-[#111c30] p-6">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Configured Rules for {service?.service_name || `Service #${selectedServiceId}`}
              </h2>
              <p className="text-sm text-gray-400">
                Total rules configured: {rules.length}
              </p>
            </div>

            <button
              onClick={() => fetchRulesForService(selectedServiceId)}
              className="rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-1.5 text-xs text-gray-300 hover:text-white"
            >
              ↻ Refresh Rules
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-400">
              Loading rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 py-10 text-center text-gray-400">
              No eligibility rules have been configured for this service yet. Use the form above to add rules.
            </div>
          ) : (
            <div className="space-y-4">

              {rules.map((rule) => {
                const isExclusion = rule.rule_type === "EXCLUSION";
                const isEditing = editingRuleId === rule.rule_id;

                return (
                  <div
                    key={rule.rule_id}
                    className={`rounded-xl border p-4 transition ${
                      isEditing
                        ? "border-amber-500 bg-[#142036]"
                        : isExclusion
                        ? "border-rose-900/60 bg-[#14121e]"
                        : "border-blue-900/60 bg-[#0f172a]"
                    }`}
                  >

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                      <div className="space-y-2">

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Rule Type Badge */}
                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                              isExclusion
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {rule.rule_type}
                          </span>

                          {/* Logical Group Badge */}
                          <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30">
                            Group {rule.logical_group || 1}
                          </span>

                          <span className="text-xs text-gray-500">
                            ID: #{rule.rule_id}
                          </span>
                        </div>

                        {/* Condition Expression */}
                        <p className="font-mono text-base font-semibold text-white">
                          <span className="text-cyan-300">{rule.field_name}</span>{" "}
                          <span className="text-yellow-400">{rule.operator}</span>{" "}
                          <span className="text-emerald-300">{rule.rule_value}</span>
                        </p>

                        {/* Description */}
                        {rule.description ? (
                          <p className="text-sm text-gray-300">
                            {rule.description}
                          </p>
                        ) : (
                          <p className="text-xs italic text-gray-500">
                            No description provided.
                          </p>
                        )}

                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">

                        <button
                          onClick={() => handleEditClick(rule)}
                          className="rounded-lg bg-blue-600/30 border border-blue-500/40 px-3.5 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-600 hover:text-white transition"
                        >
                          ✎ Edit
                        </button>

                        <button
                          onClick={() => handleDeleteRule(rule.rule_id)}
                          className="rounded-lg bg-red-600/30 border border-red-500/40 px-3.5 py-1.5 text-xs font-medium text-red-200 hover:bg-red-600 hover:text-white transition"
                        >
                          ✕ Delete
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default AdminEligibilityRules;