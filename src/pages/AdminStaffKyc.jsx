import { createElement, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Clock3, FileCheck2, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { approveAdminStaffKyc, getAdminStaffKyc, rejectAdminStaffKyc } from "../api/adminStaffKyc";

const TABS = [
    { id: "pending", label: "Pending", icon: Clock3 },
    { id: "approved", label: "Approved", icon: CheckCircle2 },
    { id: "history", label: "History", icon: FileCheck2 },
    { id: "rejected", label: "Rejected", icon: XCircle },
];

function getSubmissions(response) {
    if (Array.isArray(response)) return response;
    if (response && typeof response === "object") {
        for (const key of ["submissions", "kyc_submissions", "requests", "items", "data"]) {
            if (Array.isArray(response[key])) return response[key];
        }
    }
    throw new Error("The staff KYC response has an unexpected format.");
}

function formatDate(value) {
    if (!value) return "Not provided";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Not provided"
        : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{children}
        </p>
    ) : null;
}

export default function AdminStaffKyc() {
    const [tab, setTab] = useState("pending");
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const [error, setError] = useState("");
    const [action, setAction] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionError, setActionError] = useState("");
    const [saving, setSaving] = useState(false);

    const loadSubmissions = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getAdminStaffKyc(tab);
            setSubmissions(getSubmissions(response));
        } catch (requestError) {
            setSubmissions([]);
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { loadSubmissions(); }, [loadSubmissions, reload]);

    const changeTab = (nextTab) => {
        setTab(nextTab);
        setAction(null);
        setActionError("");
        setRejectionReason("");
    };

    const approve = async (submission) => {
        setSaving(true);
        setActionError("");
        try {
            await approveAdminStaffKyc(submission.submission_id);
            window.dispatchEvent(new Event("staff-kyc:pending-count-refresh"));
            await loadSubmissions();
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const reject = async (event) => {
        event.preventDefault();
        const reason = rejectionReason.trim();
        if (!reason || !action) {
            setActionError("Enter a reason for rejecting this KYC submission.");
            return;
        }
        setSaving(true);
        setActionError("");
        try {
            await rejectAdminStaffKyc(action.submission_id, reason);
            window.dispatchEvent(new Event("staff-kyc:pending-count-refresh"));
            setAction(null);
            setRejectionReason("");
            await loadSubmissions();
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const tabCounts = tab === "pending" ? submissions.length : null;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D9AE4B]/25 bg-gradient-to-r from-[#FBF7EE] to-[var(--ad-card)] px-6 py-5">
                <div className="flex items-center gap-4">
                    <span className="grid size-12 place-items-center rounded-xl bg-[#6B2034] text-[#F0D58A]">
                        <ShieldCheck size={23} />
                    </span>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ad-gold)]">Staff verification</p>
                        <h2 className="ad-display mt-1 text-2xl font-bold md:text-3xl">Staff KYC</h2>
                        <p className="mt-1 text-sm text-[var(--ad-muted)]">Review and manage submitted Aadhaar documents.</p>
                    </div>
                </div>
                <button type="button" onClick={() => setReload((current) => current + 1)} disabled={loading}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--ad-line)] bg-white px-4 text-sm font-semibold transition hover:border-[#862A42] disabled:opacity-60">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage>{actionError}</ErrorMessage>

            <section className="overflow-hidden rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-card)] shadow-sm">
                <div className="flex gap-1 overflow-x-auto border-b border-[var(--ad-line)] p-3" role="tablist" aria-label="Staff KYC submissions">
                    {TABS.map(({ id, label, icon }) => (
                        <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => changeTab(id)}
                            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === id ? "bg-[#5A1A2B] text-white shadow" : "text-[var(--ad-muted)] hover:bg-[#F8F3E9]"}`}>
                            {createElement(icon, { size: 16 })}{label}
                            {id === "pending" && tab === "pending" && !loading && <span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? "bg-white/15" : "bg-[#F3E4E8] text-[#5A1A2B]"}`}>{tabCounts}</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="flex items-center justify-center gap-2 p-12 text-sm text-[var(--ad-muted)]"><Loader2 size={18} className="animate-spin" /> Loading {tab} KYC submissions…</p>
                ) : error ? null : submissions.length ? (
                    <div className="grid gap-5 p-4 sm:p-6">
                        {submissions.map((submission) => (
                            <article key={submission.submission_id} className="overflow-hidden rounded-xl border border-[var(--ad-line)] bg-white">
                                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--ad-line)] bg-[#FAF8F5] px-4 py-4 sm:px-5">
                                    <div>
                                        <h3 className="font-bold">{submission.staff_name || "Staff member"}</h3>
                                        <p className="mt-1 text-sm text-[var(--ad-muted)]">
                                            Staff ID: {submission.staff_id || "—"} <span className="mx-1">·</span> Submission #{submission.submission_id}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--ad-muted)]">Submitted {formatDate(submission.submitted_at)}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${String(submission.status).toUpperCase() === "APPROVED" ? "bg-emerald-50 text-emerald-800" : String(submission.status).toUpperCase() === "REJECTED" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"}`}>
                                        {submission.status || "Unknown status"}
                                    </span>
                                </div>
                                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                                    {[
                                        ["Aadhaar front", submission.aadhaar_front_image],
                                        ["Aadhaar back", submission.aadhaar_back_image],
                                    ].map(([label, imageUrl]) => (
                                        <div key={label} className="min-w-0">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ad-muted)]">{label}</p>
                                            {imageUrl ? (
                                                <a href={imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-[var(--ad-line)] bg-[#FAF8F5]">
                                                    <img src={imageUrl} alt={`${submission.staff_name || "Staff"} ${label}`} loading="lazy" className="h-64 w-full object-contain p-2" />
                                                    <span className="block border-t border-[var(--ad-line)] bg-white px-3 py-2 text-xs font-semibold text-[#862A42]">Open full image</span>
                                                </a>
                                            ) : <p className="grid h-40 place-items-center rounded-lg border border-dashed border-[var(--ad-line)] text-sm text-[var(--ad-muted)]">Image not available</p>}
                                        </div>
                                    ))}
                                </div>
                                {tab === "pending" && (
                                    <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--ad-line)] px-4 py-4 sm:px-5">
                                        <button type="button" disabled={saving} onClick={() => { setAction(submission); setActionError(""); }}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60">
                                            <XCircle size={16} /> Reject
                                        </button>
                                        <button type="button" disabled={saving} onClick={() => approve(submission)}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-14 text-center">
                        <ShieldCheck size={30} className="mx-auto text-[var(--ad-gold)]" />
                        <p className="mt-3 font-semibold">No {tab} KYC submissions</p>
                        <p className="mt-1 text-sm text-[var(--ad-muted)]">Submissions in this category will appear here.</p>
                    </div>
                )}
            </section>

            {action && createPortal(
                <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-md sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !saving) {
                            setAction(null);
                            setActionError("");
                        }
                    }}>
                    <form onSubmit={reject} className="w-full max-w-lg rounded-2xl border border-[#E6DFC9] bg-white p-5 text-[#2A1A1F] shadow-2xl sm:p-6">
                        <h2 className="text-xl font-bold">Reject KYC submission</h2>
                        <p className="mt-1 text-sm text-[#80707A]">
                            Enter the reason for rejecting {action.staff_name || "this staff member"}’s Aadhaar documents.
                        </p>
                        <label className="mt-5 block text-sm font-semibold" htmlFor="kyc-rejection-reason">Rejection reason</label>
                        <textarea id="kyc-rejection-reason" required autoFocus rows={4} value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-[#E6DFC9] bg-white px-3 py-2.5 text-sm focus:border-[#862A42] focus:outline-none" />
                        {actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button" disabled={saving} onClick={() => { setAction(null); setActionError(""); }}
                                className="h-11 rounded-xl border border-[#E6DFC9] px-4 text-sm font-semibold disabled:opacity-60 sm:h-10">Cancel</button>
                            <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-60 sm:h-10">
                                {saving && <Loader2 size={16} className="animate-spin" />} Confirm rejection
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
}
