import { authenticatedStaffRequest } from "./staffAuth";

export function getStaffDashboardSummary() {
    return authenticatedStaffRequest("/staff/dashboard/summary");
}
