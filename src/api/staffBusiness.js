import { authenticatedStaffRequest } from "./staffAuth";

const BUSINESS_PATH = "/businesses/";

export function getStaffBusinesses() {
    return authenticatedStaffRequest(BUSINESS_PATH);
}

export function getStaffBusiness(id) {
    return authenticatedStaffRequest(`${BUSINESS_PATH}${encodeURIComponent(id)}`);
}

export function createStaffBusiness(formData) {
    return authenticatedStaffRequest(BUSINESS_PATH, { method: "POST", body: formData });
}

export function updateStaffBusiness(id, formData) {
    return authenticatedStaffRequest(`${BUSINESS_PATH}${encodeURIComponent(id)}`, { method: "PUT", body: formData });
}

export function deleteStaffBusiness(id) {
    return authenticatedStaffRequest(`${BUSINESS_PATH}${encodeURIComponent(id)}`, { method: "DELETE" });
}
