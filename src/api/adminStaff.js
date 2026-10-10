import { authenticatedAdminRequest } from "./adminLogin";

export function getAdminStaff() {
    return authenticatedAdminRequest("/admin/staff");
}

export function getAdminStaffPrint() {
    return authenticatedAdminRequest("/admin/staff/print");
}

export function getAdminStaffMember(staffId) {
    return authenticatedAdminRequest(`/admin/staff/${encodeURIComponent(staffId)}`);
}

export function searchAdminStaffById(staffId) {
    return authenticatedAdminRequest(`/admin/staff/search/${encodeURIComponent(staffId)}`);
}

export function updateAdminStaffProfile(staffId, profile) {
    const formData = new FormData();
    ["name", "email", "phone", "guardian_contact_number", "address", "password", "aadhaar_number", "state", "district"].forEach((field) => {
        if (profile[field] !== undefined && profile[field] !== null) formData.append(field, profile[field]);
    });
    ["aadhaar_front_image", "aadhaar_back_image"].forEach((field) => {
        if (profile[field]) formData.append(field, profile[field]);
    });

    return authenticatedAdminRequest(`/admin/staff/${encodeURIComponent(staffId)}/profile`, {
        method: "PUT",
        body: formData,
    });
}

export function registerAdminStaff({
    name,
    email,
    password,
    phone,
    guardian_contact_number,
    address,
    aadhaar_number,
    state,
    district,
    aadhaar_front_image,
    aadhaar_back_image,
}) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    formData.append("guardian_contact_number", guardian_contact_number);
    formData.append("address", address);
    formData.append("aadhaar_number", aadhaar_number);
    formData.append("state", state);
    formData.append("district", district);
    if (aadhaar_front_image) formData.append("aadhaar_front_image", aadhaar_front_image);
    if (aadhaar_back_image) formData.append("aadhaar_back_image", aadhaar_back_image);

    return authenticatedAdminRequest("/admin/staff/register", {
        method: "POST",
        body: formData,
    });
}

export function updateAdminStaffStatus(staffId, status) {
    return authenticatedAdminRequest(`/admin/staff/${encodeURIComponent(staffId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
}
