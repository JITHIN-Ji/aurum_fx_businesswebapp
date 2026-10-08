const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const STAFF_TOKEN_KEY = "afx_staff_token";

export class StaffApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "StaffApiError";
        this.status = status;
    }
}

export function getStaffToken() {
    return window.sessionStorage.getItem(STAFF_TOKEN_KEY)
        || window.localStorage.getItem(STAFF_TOKEN_KEY)
        || "";
}

export function saveStaffToken(token, remember) {
    clearStaffToken();
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(STAFF_TOKEN_KEY, token);
}

export function clearStaffToken() {
    window.sessionStorage.removeItem(STAFF_TOKEN_KEY);
    window.localStorage.removeItem(STAFF_TOKEN_KEY);
}

function parseResponse(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function errorMessage(data, fallback) {
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
        return data.detail.map((item) => item.msg).filter(Boolean).join(". ") || fallback;
    }
    if (typeof data?.message === "string") return data.message;
    return fallback;
}

async function request(path, { auth = false, ...options } = {}) {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not configured. Add it to .env and restart the development server.");
    }

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

    if (auth) {
        const token = getStaffToken();
        if (!token) throw new StaffApiError("Please sign in to continue.");
        headers.set("Authorization", `Bearer ${token}`);
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch (error) {
        throw new Error(`Could not connect to the staff service. ${error.message}`);
    }

    const data = parseResponse(await response.text());
    if (!response.ok) {
        if (auth && (response.status === 401 || response.status === 403)) {
            clearStaffToken();
            window.dispatchEvent(new Event("staff:unauthorized"));
        }
        throw new StaffApiError(errorMessage(data, `Staff request failed (${response.status}).`), response.status);
    }
    return data;
}

export function authenticatedStaffRequest(path, options = {}) {
    return request(path, { ...options, auth: true });
}

function tokenFromResponse(response) {
    if (typeof response === "string" && response.trim()) return response.trim();
    const token = response?.access_token || response?.token || response?.auth_token
        || response?.data?.access_token || response?.data?.token;
    return typeof token === "string" && token.trim() ? token.trim() : "";
}

export async function loginStaff({ staffId, password, remember }) {
    const response = await request("/staff-auth/login", {
        method: "POST",
        body: JSON.stringify({ staff_id: staffId, password }),
    });
    const staff = response?.staff || response?.data?.staff || response?.data;
    if (typeof staff?.status === "string" && staff.status.toLowerCase() !== "active") {
        clearStaffToken();
        throw new StaffApiError("This staff account is inactive. Contact an administrator to restore access.");
    }
    const token = tokenFromResponse(response);
    if (!token) {
        throw new StaffApiError("The login response did not include an authentication token.");
    }
    saveStaffToken(token, remember);
    return response;
}

export function getStaffProfile() {
    return request("/staff/profile", { auth: true });
}
