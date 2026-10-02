import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AdminEligibilityRules() {
  const navigate = useNavigate();
  const { serviceId } = useParams();

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("user_role");

  const [rules, setRules] = useState([]);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

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

    fetchRules();
  }, [role, navigate, serviceId]);

  // Fetch rules
  const fetchRules = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/eligibility-rules?user_id=${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to load eligibility rules");
        return;
      }

      // Keep only rules belonging to this service
      const serviceRules = (data.rules || []).filter(
        (rule) => rule.service_id === Number(serviceId)
      );

      setRules(serviceRules);

      // Get service information
      await fetchService();

    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // Fetch service information
  const fetchService = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/services?user_id=${userId}`
      );

      const data = await response.json();

      if (response.ok) {
        const selectedService = (data.services || []).find(
          (item) => item.service_id === Number(serviceId)
        );

        setService(selectedService || null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Add rule
  const handleAddRule = async (e) => {
    e.preventDefault();

    if (!form.field_name || !form.rule_value) {
      alert("Please enter field name and rule value");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/eligibility-rules?user_id=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: Number(serviceId),
            rule_type: form.rule_type,
            field_name: form.field_name,
            operator: form.operator,
            rule_value: form.rule_value,
            logical_group: Number(form.logical_group),
            description: form.description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to add rule");
        return;
      }

      alert("Eligibility rule added successfully");

      setForm({
        rule_type: "REQUIREMENT",
        field_name: "",
        operator: "==",
        rule_value: "",
        logical_group: 1,
        description: "",
      });

      fetchRules();

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

      fetchRules();

    } catch (error) {
      console.error(error);
      alert("Unable to connect to backend");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-[#111c30] px-6 py-4">

        <div>
          <h1 className="text-2xl font-bold">
            Eligibility Rules
          </h1>

          <p className="text-sm text-gray-400">
            {service?.service_name || "Government Service"}
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/services")}
          className="rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-700"
        >
          Back to Services
        </button>

      </header>

      <main className="p-6">

        {/* Service information */}
        {service && (
          <div className="mb-6 rounded-xl border border-gray-700 bg-[#111c30] p-6">

            <h2 className="text-xl font-semibold">
              {service.service_name}
            </h2>

            <p className="mt-1 text-sm text-blue-400">
              {service.department}
            </p>

            <p className="mt-3 text-sm text-gray-400">
              Eligibility Mode:{" "}
              <span className="text-white">
                {service.eligibility_mode || "Rule Based"}
              </span>
            </p>

          </div>
        )}

        {/* Add Rule */}
        <div className="mb-6 rounded-xl border border-gray-700 bg-[#111c30] p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Add Eligibility Rule
          </h2>

          <form
            onSubmit={handleAddRule}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >

            {/* Rule Type */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Rule Type
              </label>

              <select
                name="rule_type"
                value={form.rule_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              >
                <option value="REQUIREMENT">
                  Requirement
                </option>

                <option value="EXCLUSION">
                  Exclusion
                </option>
              </select>
            </div>

            {/* Field Name */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Field Name
              </label>

              <input
                type="text"
                name="field_name"
                value={form.field_name}
                onChange={handleChange}
                placeholder="Example: landholder"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Operator
              </label>

              <select
                name="operator"
                value={form.operator}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              >
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value=">">Greater than</option>
                <option value=">=">Greater than or equal</option>
                <option value="<">Less than</option>
                <option value="<=">Less than or equal</option>
              </select>
            </div>

            {/* Rule Value */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Rule Value
              </label>

              <input
                type="text"
                name="rule_value"
                value={form.rule_value}
                onChange={handleChange}
                placeholder="Example: true"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Logical Group */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Logical Group
              </label>

              <input
                type="number"
                name="logical_group"
                value={form.logical_group}
                onChange={handleChange}
                min="1"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Description
              </label>

              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Explain this eligibility rule"
                className="w-full rounded-lg border border-gray-600 bg-[#0b1220] px-3 py-2 text-white"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2">

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium hover:bg-blue-700"
              >
                + Add Rule
              </button>

            </div>

          </form>

        </div>

        {/* Existing Rules */}
        <div className="rounded-xl border border-gray-700 bg-[#111c30] p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Existing Eligibility Rules
          </h2>

          {loading ? (
            <p className="text-gray-400">
              Loading rules...
            </p>
          ) : rules.length === 0 ? (
            <p className="text-gray-400">
              No eligibility rules have been added for this service.
            </p>
          ) : (
            <div className="space-y-4">

              {rules.map((rule) => (

                <div
                  key={rule.rule_id}
                  className="rounded-lg border border-gray-700 bg-[#0b1220] p-4"
                >

                  <div className="flex flex-col justify-between gap-4 md:flex-row">

                    <div>

                      <p className="font-semibold">
                        {rule.field_name}{" "}
                        <span className="text-blue-400">
                          {rule.operator}
                        </span>{" "}
                        {rule.rule_value}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Type: {rule.rule_type}
                      </p>

                      {rule.description && (
                        <p className="mt-2 text-sm text-gray-300">
                          {rule.description}
                        </p>
                      )}

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteRule(rule.rule_id)
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700"
                    >
                      Delete
                    </button>

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

export default AdminEligibilityRules;