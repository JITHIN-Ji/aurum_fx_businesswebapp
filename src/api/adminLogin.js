const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const ADMIN_TOKEN_KEY = "afx_admin_token";
const ADMIN_DATA_KEY = "afx_admin";

export function getAdminToken() {
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function getAdminData() {
    const storedAdmin = window.sessionStorage.getItem(ADMIN_DATA_KEY);
    if (!storedAdmin) return null;
    try {
        return JSON.parse(storedAdmin);
    } catch {
        window.sessionStorage.removeItem(ADMIN_DATA_KEY);
        return null;
    }
}

export function clearAdminSession() {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    window.sessionStorage.removeItem(ADMIN_DATA_KEY);
}

export async function authenticatedAdminRequest(path, options = {}) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
    if (!apiBaseUrl) {
        throw new Error("VITE_API_BASE_URL is not configured. Add it to .env and restart the development server.");
    }

    const token = getAdminToken();
    if (!token) throw new Error("Please sign in as an admin to continue.");

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${token}`);

    let response;
    try {
        response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
    } catch (error) {
        throw new Error(`Could not connect to the admin service. ${error.message}`);
    }

    const data = parseResponse(await response.text());
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) clearAdminSession();
        throw new Error(responseError(data, `Admin request failed (${response.status}).`));
    }
    return data;
}

export function updateAdminProfile(profile) {
    return authenticatedAdminRequest("/admin-profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
    });
}

function parseResponse(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function responseError(data, fallback) {
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
        return data.detail.map((item) => item.msg).filter(Boolean).join(". ") || fallback;
    }
    if (typeof data?.message === "string") return data.message;
    return fallback;
}

export async function loginAdmin({ email, password }) {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not configured. Add it to .env and restart the development server.");
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/admin-auth/login`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    } catch (error) {
        throw new Error(`Could not connect to the admin service. ${error.message}`);
    }

    const data = parseResponse(await response.text());
    if (!response.ok) {
        throw new Error(responseError(data, `Admin sign in failed (${response.status}).`));
    }

    if (typeof data?.access_token !== "string" || !data.access_token.trim() || !data.admin) {
        throw new Error("The admin login response is missing its access token or admin details.");
    }

    try {
        window.sessionStorage.setItem(ADMIN_TOKEN_KEY, data.access_token);
        window.sessionStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.admin));
    } catch (error) {
        clearAdminSession();
        throw new Error(`Could not save the admin session in this browser. ${error.message}`);
    }

    return data;
}
