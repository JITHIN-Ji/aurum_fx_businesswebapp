import { authenticatedAdminRequest } from "./adminLogin";

export function getAdminDashboardSummary() {
    return authenticatedAdminRequest("/admin/dashboard/summary");
}
