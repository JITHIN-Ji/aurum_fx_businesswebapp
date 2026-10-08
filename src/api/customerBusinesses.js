const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

export async function getCustomerBusinesses(filters = {}) {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not configured. Add it to .env and restart the development server.");
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim()) {
            params.set(key, String(value).trim());
        }
    });

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/customer/businesses?${params.toString()}`, {
            headers: { Accept: "application/json" },
        });
    } catch (error) {
        throw new Error(`Could not connect to the business directory. ${error.message}`);
    }

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        const detail = typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
                ? data.detail.map((item) => item.msg).filter(Boolean).join(". ")
                : typeof data?.message === "string" ? data.message : "";
        throw new Error(detail || `Business directory request failed (${response.status}).`);
    }

    return data;
}
