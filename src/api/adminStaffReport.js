import { clearAdminSession, getAdminToken } from "./adminLogin";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const REPORT_PATH = "/admin/staff-report";
const NO_DATE_REPORT_PATH = `${REPORT_PATH}/staff`;

function buildReportUrl(path, { staff_id, from_date, to_date }) {
    const params = new URLSearchParams({ staff_id });
    if (from_date) params.set("from_date", from_date);
    if (to_date) params.set("to_date", to_date);
    return `${path}?${params.toString()}`;
}

function reportPath(path, params) {
    return params.from_date && params.to_date
        ? `${REPORT_PATH}${path}`
        : `${NO_DATE_REPORT_PATH}${path}`;
}

async function requestStaffReport(path, params, accept) {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not configured. Add it to .env and restart the development server.");
    }

    const token = getAdminToken();
    if (!token) throw new Error("Please sign in as an admin to continue.");

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${buildReportUrl(path, params)}`, {
            headers: {
                Accept: accept,
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        throw new Error(`Could not connect to the admin service. ${error.message}`);
    }

    if (!response.ok) {
        const body = await response.text();
        if (response.status === 401 || response.status === 403) clearAdminSession();
        let detail = body;
        try {
            const data = JSON.parse(body);
            detail = typeof data?.detail === "string"
                ? data.detail
                : Array.isArray(data?.detail)
                    ? data.detail.map((item) => item.msg).filter(Boolean).join(". ")
                    : data?.message || body;
        } catch {
            // Keep the response text when the API returns a non-JSON error.
        }
        throw new Error(detail || `Staff report request failed (${response.status}).`);
    }

    return response;
}

export async function getAdminStaffReport(params) {
    const response = await requestStaffReport(reportPath("", params), params, "application/json");
    const data = await response.json();
    if (!data?.staff || !data?.report || !Array.isArray(data.businesses)) {
        throw new Error("The staff report response has an unexpected format.");
    }
    return data;
}

export async function exportAdminStaffReport(params) {
    const response = await requestStaffReport(reportPath("/export", params), params, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const disposition = response.headers.get("content-disposition") || "";
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `staff_report_${params.staff_id}.xlsx`;
    return { blob: await response.blob(), filename };
}

export async function getAdminStaffReportPrint(params) {
    const response = await requestStaffReport(reportPath("/print", params), params, "text/html");
    return response.text();
}
