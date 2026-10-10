import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Building2, Download, Loader2, Printer, RefreshCw, Search, X } from "lucide-react";
import { getAdminStaff } from "../api/adminStaff";
import { exportAdminStaffReport, getAdminStaffReport, getAdminStaffReportPrint } from "../api/adminStaffReport";

const display = (value) => value || "—";
const normalize = (value) => String(value || "").trim().toLocaleLowerCase("en-IN");

function Panel({ children, className = "" }) {
    return <section className={`asb-panel ${className}`}>{children}</section>;
}

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{children}
        </p>
    ) : null;
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded bg-[#F3E4E8] text-[#862A42]">{createElement(Icon, { size: 20 })}</span>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ad-muted)]">{label}</p>
                <p className="text-2xl font-bold">{value.toLocaleString("en-IN")}</p>
            </div>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminStaffBusinesses() {
    const [staffMembers, setStaffMembers] = useState([]);
    const [staffLoading, setStaffLoading] = useState(true);
    const [staffError, setStaffError] = useState("");
    const [filters, setFilters] = useState({ staffName: "", staffId: "", fromDate: "", toDate: "" });
    const [applied, setApplied] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    const [staffReload, setStaffReload] = useState(0);

    useEffect(() => {
        let active = true;
        setStaffLoading(true);
        setStaffError("");
        getAdminStaff()
            .then((data) => {
                if (!Array.isArray(data?.staff)) throw new Error("The staff response has an unexpected format.");
                if (active) setStaffMembers(data.staff);
            })
            .catch((requestError) => { if (active) setStaffError(requestError.message); })
            .finally(() => { if (active) setStaffLoading(false); });
        return () => { active = false; };
    }, [staffReload]);

    useEffect(() => {
        if (!applied) return undefined;
        let active = true;
        setLoading(true);
        setError("");

        getAdminStaffReport({
            staff_id: applied.staffId,
            from_date: applied.fromDate || undefined,
            to_date: applied.toDate || undefined,
        })
            .then((data) => {
                if (active) setReportData(data);
            })
            .catch((requestError) => {
                if (active) {
                    setReportData(null);
                    setError(requestError.message);
                }
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [applied, reload]);

    const searched = Boolean(applied);
    const setFilter = (key) => (event) => {
        const value = event.target.value;
        setFilters((current) => {
            if (key === "staffName") {
                const member = staffMembers.find((item) => normalize(item.name) === normalize(value));
                return { ...current, staffName: value, staffId: member?.staff_id || "" };
            }
            if (key === "staffId") {
                const member = staffMembers.find((item) => item.staff_id === value);
                return { ...current, staffId: value, staffName: member?.name || "" };
            }
            return { ...current, [key]: value };
        });
    };
    const refresh = () => {
        if (searched) setReload((value) => value + 1);
        else setStaffReload((value) => value + 1);
    };
    const search = (event) => {
        event.preventDefault();
        const nameMatch = staffMembers.find((member) => normalize(member.name) === normalize(filters.staffName));
        const staffId = filters.staffId.trim() || nameMatch?.staff_id || "";
        if (!staffId) {
            setError("Enter a staff ID or select a matching staff name from the suggestions.");
            return;
        }
        if (Boolean(filters.fromDate) !== Boolean(filters.toDate)) {
            setError("Enter both dates for a date-filtered report, or leave both dates empty for the full staff report.");
            return;
        }
        if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
            setError("The start date must be before or equal to the end date.");
            return;
        }
        setError("");
        setFilters((current) => ({ ...current, staffId, staffName: nameMatch?.name || current.staffName }));
        setApplied({ ...filters, staffId, staffName: nameMatch?.name || filters.staffName });
    };
    const clear = () => {
        setFilters({ staffName: "", staffId: "", fromDate: "", toDate: "" });
        setApplied(null);
        setReportData(null);
        setError("");
    };
    const reportParams = applied ? {
        staff_id: applied.staffId,
        from_date: applied.fromDate || undefined,
        to_date: applied.toDate || undefined,
    } : null;
    const exportReport = async () => {
        if (!reportParams) return;
        setActionLoading("export");
        setError("");
        try {
            const { blob, filename } = await exportAdminStaffReport(reportParams);
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setActionLoading("");
        }
    };
    const printReport = async () => {
        if (!reportParams) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            setError("Allow pop-ups for this site to open the printable staff report.");
            return;
        }
        setActionLoading("print");
        setError("");
        try {
            const html = await getAdminStaffReportPrint(reportParams);
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } catch (requestError) {
            printWindow.close();
            setError(requestError.message);
        } finally {
            setActionLoading("");
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <style>{CSS}</style>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Staff reports</h2>
                    <p className="mt-1 text-[var(--ad-muted)]">Generate, print, or export a full staff report or filter it by date range.</p>
                </div>
                <button type="button" onClick={refresh} disabled={loading || staffLoading || Boolean(actionLoading)} className="asb-btn">
                    <RefreshCw size={16} className={loading || staffLoading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <Panel className="p-5 md:p-6">
                <form onSubmit={search} className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="block text-sm font-semibold">
                        Staff name
                        <input list="staff-business-names" value={filters.staffName} onChange={setFilter("staffName")} disabled={staffLoading || Boolean(staffError)} placeholder={staffLoading ? "Loading staff…" : "Type or select a staff name"} className="asb-input mt-1.5" />
                        <datalist id="staff-business-names">
                            {[...staffMembers].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))).map((member) => (
                                <option key={member.id || member.staff_id} value={member.name || ""}>
                                    {member.staff_id || ""}
                                </option>
                            ))}
                        </datalist>
                    </label>
                    <label className="block text-sm font-semibold">
                        Staff ID
                        <input value={filters.staffId} onChange={setFilter("staffId")} placeholder="Type a staff ID" className="asb-input mt-1.5" />
                    </label>
                    <label className="block text-sm font-semibold">
                        From date
                        <input type="date" value={filters.fromDate} onChange={setFilter("fromDate")} className="asb-input mt-1.5" />
                    </label>
                    <label className="block text-sm font-semibold">
                        To date
                        <input type="date" value={filters.toDate} onChange={setFilter("toDate")} className="asb-input mt-1.5" />
                    </label>
                    <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4">
                        <button type="submit" className="asb-btn-primary" disabled={staffLoading || loading || Boolean(actionLoading)}>
                            <Search size={16} /> Search
                        </button>
                        <button type="button" onClick={clear} className="asb-btn"><X size={16} /> Clear</button>
                    </div>
                </form>
            </Panel>

            <ErrorMessage>{staffError}</ErrorMessage>
            <ErrorMessage>{error}</ErrorMessage>

            {loading ? (
                <Panel><p className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--ad-muted)]"><Loader2 size={17} className="animate-spin" /> Searching staff businesses…</p></Panel>
            ) : searched && reportData ? (
                <>
                    <div className="asb-stats">
                        <Panel><Stat icon={Building2} label="Businesses in report" value={Number(reportData.report.business_count) || 0} /></Panel>
                    </div>
                    <Panel className="overflow-hidden !p-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ad-line)] px-6 py-4">
                            <div>
                                <p className="text-lg font-bold">{display(reportData.staff.name)}</p>
                                <p className="mt-1 text-sm text-[var(--ad-muted)]">Staff ID <span className="asb-chip">{display(reportData.staff.staff_id || applied.staffId)}</span></p>
                                {reportData.report.from_date && reportData.report.to_date && (
                                    <p className="mt-1 text-xs text-[var(--ad-muted)]">{formatDate(reportData.report.from_date)} – {formatDate(reportData.report.to_date)}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={printReport} disabled={Boolean(actionLoading)} className="asb-btn">
                                    <Printer size={15} /> {actionLoading === "print" ? "Preparing…" : "Print"}
                                </button>
                                <button type="button" onClick={exportReport} disabled={Boolean(actionLoading)} className="asb-btn-primary">
                                    <Download size={15} /> {actionLoading === "export" ? "Exporting…" : "Export Excel"}
                                </button>
                            </div>
                        </div>
                        {reportData.businesses.length ? (
                            <div className="overflow-x-auto">
                                <table className="asb-table w-full min-w-[850px] text-left text-sm">
                                    <thead><tr><th>Business</th><th>Category</th><th>Owner</th><th>Phone</th><th>District</th><th>Added</th></tr></thead>
                                    <tbody>{reportData.businesses.map((business) => (
                                        <tr key={business.business_id}>
                                            <td>
                                                <Link to={`/admin/businesses/${business.business_id}`} className="font-semibold hover:text-[var(--ad-gold)]">{display(business.business_name)}</Link>
                                            </td>
                                            <td>{display(business.category)}</td>
                                            <td>{display(business.owner_name)}</td>
                                            <td>{display(business.phone)}</td>
                                            <td>{display(business.district)}</td>
                                            <td>{formatDate(business.created_at)}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="px-6 py-10 text-center text-sm text-[var(--ad-muted)]">
                                {applied.fromDate ? "No businesses were added during the selected date range." : "This staff member has not added any businesses."}
                            </p>
                        )}
                    </Panel>
                </>
            ) : searched && !error ? (
                <Panel className="py-12 text-center">
                    <Building2 size={28} className="mx-auto text-[var(--ad-gold)]" />
                    <p className="mt-3 font-semibold">No report data available</p>
                    <p className="mt-1 text-sm text-[var(--ad-muted)]">Try another staff member or date range.</p>
                </Panel>
            ) : !searched && !staffError && !staffLoading ? (
                <Panel className="py-12 text-center">
                    <Building2 size={28} className="mx-auto text-[var(--ad-gold)]" />
                    <p className="mt-3 font-semibold">Create a staff report</p>
                    <p className="mt-1 text-sm text-[var(--ad-muted)]">Select or enter a staff name or ID. Add both dates to filter, or leave both empty for the full report.</p>
                </Panel>
            ) : staffLoading && !searched ? (
                <Panel><p className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--ad-muted)]"><Loader2 size={17} className="animate-spin" /> Loading staff list…</p></Panel>
            ) : null}
        </div>
    );
}

const CSS = `
.asb-panel{background:var(--ad-card); border:1px solid var(--ad-line); border-radius:6px; box-shadow:0 1px 2px rgba(42,26,31,.06)}
.asb-stats{display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
.asb-btn,.asb-btn-primary{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:6px; font-size:14px; font-weight:600; transition:border-color .15s,background .15s,color .15s}
.asb-btn{background:#fff; border:1px solid #D8D0BC; color:var(--ad-text)}
.asb-btn:hover:not(:disabled){border-color:#862A42; background:#FBF8F6}
.asb-btn-primary{background:#5A1A2B; color:#fff; border:1px solid #5A1A2B}
.asb-btn-primary:hover:not(:disabled){background:#6B2034}
.asb-btn:disabled,.asb-btn-primary:disabled{opacity:.6; cursor:not-allowed}
.asb-input{width:100%; height:42px; padding:0 12px; border-radius:6px; border:1px solid #D8D0BC; background:#fff; font-size:14px; font-weight:400}
.asb-input:focus{outline:none; border-color:#862A42; box-shadow:0 0 0 3px rgba(134,42,66,.12)}
.asb-table th{padding:12px 20px; font-size:11.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--ad-muted); background:#FAF8F5; border-bottom:1px solid var(--ad-line); white-space:nowrap}
.asb-table td{padding:14px 20px; border-bottom:1px solid var(--ad-line); vertical-align:middle}
.asb-table tbody tr:last-child td{border-bottom:0}
.asb-table tbody tr:hover{background:#FAF8F5}
.asb-chip{display:inline-block; padding:3px 9px; border-radius:4px; font-size:12px; font-weight:600; color:#5A1A2B; background:#F3E4E8; border:1px solid #E6C3CC}
`;
