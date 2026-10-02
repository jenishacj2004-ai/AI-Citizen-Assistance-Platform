const API_BASE_URL = "http://127.0.0.1:8000";

export const getEligibilityRules = async () => {
    const response = await fetch(
        `${API_BASE_URL}/admin/eligibility-rules`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch eligibility rules");
    }

    return response.json();
};


export const createEligibilityRule = async (ruleData) => {
    const response = await fetch(
        `${API_BASE_URL}/admin/eligibility-rules`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ruleData)
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create eligibility rule");
    }

    return response.json();
};


export const updateEligibilityRule = async (ruleId, ruleData) => {
    const response = await fetch(
        `${API_BASE_URL}/admin/eligibility-rules/${ruleId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ruleData)
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update eligibility rule");
    }

    return response.json();
};


export const deleteEligibilityRule = async (ruleId) => {
    const response = await fetch(
        `${API_BASE_URL}/admin/eligibility-rules/${ruleId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete eligibility rule");
    }

    return response.json();
};