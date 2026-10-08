import { authenticatedAdminRequest } from "./adminLogin";

const BUSINESS_PATH = "/admin/businesses";

export function getAdminBusinesses(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim()) {
            params.set(key, String(value).trim());
        }
    });
    const query = params.toString();
    return authenticatedAdminRequest(`${BUSINESS_PATH}${query ? `?${query}` : ""}`);
}

export function getAdminBusiness(id) {
    return authenticatedAdminRequest(`${BUSINESS_PATH}/${encodeURIComponent(id)}`);
}

export function createAdminBusiness(formData) {
    return authenticatedAdminRequest(BUSINESS_PATH, { method: "POST", body: formData });
}

export function updateAdminBusiness(id, formData) {
    return authenticatedAdminRequest(`${BUSINESS_PATH}/${encodeURIComponent(id)}`, { method: "PUT", body: formData });
}

export function deleteAdminBusiness(id) {
    return authenticatedAdminRequest(`${BUSINESS_PATH}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
