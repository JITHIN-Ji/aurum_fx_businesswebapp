import { authenticatedAdminRequest } from "./adminLogin";

export function getAdminStaff() {
    return authenticatedAdminRequest("/admin/staff");
}

export function getAdminStaffMember(staffId) {
    return authenticatedAdminRequest(`/admin/staff/${encodeURIComponent(staffId)}`);
}

export function searchAdminStaffById(staffId) {
    return authenticatedAdminRequest(`/admin/staff/search/${encodeURIComponent(staffId)}`);
}

export function updateAdminStaffProfile(staffId, profile) {
    return authenticatedAdminRequest(`/admin/staff/${encodeURIComponent(staffId)}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
    });
}

export function registerAdminStaff({ name, email, password, phone, address }) {
    return authenticatedAdminRequest("/admin/staff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, address }),
    });
}

export function updateAdminStaffStatus(staffId, status) {
    return authenticatedAdminRequest(`/admin/staff/${encodeURIComponent(staffId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
}
