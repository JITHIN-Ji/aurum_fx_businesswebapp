import { authenticatedAdminRequest } from "./adminLogin";

const STAFF_KYC_PATH = "/admin/staff-kyc";

export function getAdminStaffKyc(tab, staffId) {
    const endpoints = {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
        history: "history",
    };
    const endpoint = endpoints[tab];
    if (!endpoint) throw new Error(`Unknown staff KYC tab: ${tab}`);
    const params = new URLSearchParams();
    if (tab === "history" && staffId?.trim()) params.set("staff_id", staffId.trim());
    const query = params.toString();
    return authenticatedAdminRequest(`${STAFF_KYC_PATH}/${endpoint}${query ? `?${query}` : ""}`);
}

export function approveAdminStaffKyc(submissionId) {
    return authenticatedAdminRequest(`${STAFF_KYC_PATH}/${encodeURIComponent(submissionId)}/approve`, {
        method: "PATCH",
    });
}

export function rejectAdminStaffKyc(submissionId, rejectionReason) {
    return authenticatedAdminRequest(`${STAFF_KYC_PATH}/${encodeURIComponent(submissionId)}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
}
