import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileCheck2, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { getStaffKycStatus, getStaffProfile, uploadStaffKyc } from "../api/staffAuth";

function formatStatus(status) {
    if (typeof status === "string" && status.trim()) return status.trim();
    if (status && typeof status === "object") {
        const value = status.status || status.kyc_status || status.verification_status || status.message || status.detail;
        if (typeof value === "string" && value.trim()) return value.trim();
        if (value && typeof value === "object") return formatStatus(value);
        return JSON.stringify(status);
    }
    return "Not submitted";
}

function statusColors(status) {
    const value = formatStatus(status).toLocaleUpperCase("en-IN");
    if (value.includes("APPROVED")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (value.includes("PENDING")) return "border-rose-200 bg-rose-50 text-rose-800";
    if (value.includes("REJECTED")) return "border-rose-200 bg-rose-50 text-rose-800";
    return "border-[var(--d-line)] bg-[var(--d-card)] text-[var(--d-muted)]";
}

function DocumentCard({ title, imageUrl }) {
    return (
        <div className="min-w-0 rounded-xl border border-[var(--d-line)] bg-[var(--d-card)] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--d-muted)]">{title}</h3>
            {imageUrl ? (
                <>
                    <a href={imageUrl} target="_blank" rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-[var(--d-line)] bg-white">
                        <img src={imageUrl} alt={title} loading="lazy" className="h-64 w-full object-contain p-2" />
                        <span className="block border-t border-[var(--d-line)] px-3 py-2 text-center text-xs font-semibold text-[var(--d-gold-deep)]">
                            Open full image
                        </span>
                    </a>
                    <a href={imageUrl} download className="mt-2 inline-flex text-sm font-semibold text-[var(--d-gold-deep)] hover:underline">
                        Download image
                    </a>
                </>
            ) : (
                <div className="grid h-64 place-items-center rounded-lg border border-dashed border-[var(--d-line)] bg-[var(--d-bg)] text-sm text-[var(--d-muted)]">
                    No image uploaded
                </div>
            )}
        </div>
    );
}

export default function StaffKyc() {
    const [staff, setStaff] = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusError, setStatusError] = useState("");
    const [files, setFiles] = useState({ aadhaar_front_image: null, aadhaar_back_image: null });
    const [saving, setSaving] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [success, setSuccess] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        setStatusError("");
        Promise.all([
            getStaffProfile().then((data) => { if (active) setStaff(data); })
                .catch((requestError) => { if (active) setError(requestError.message); }),
            getStaffKycStatus().then((data) => { if (active) setStatus(data); })
                .catch((requestError) => { if (active) setStatusError(requestError.message); }),
        ]).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reload]);

    const currentStatus = statusError ? null : formatStatus(status);
    const isApproved = Boolean(currentStatus?.toLocaleUpperCase("en-IN").includes("APPROVED"));

    const submit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setUploadError("");
        setSuccess("");
        if (loading || statusError) {
            setUploadError("KYC status is unavailable. Refresh the page before submitting documents.");
            return;
        }
        if (isApproved) {
            setUploadError("Your KYC is approved. You can download your Aadhaar images, but cannot change or resubmit them.");
            return;
        }
        if (!files.aadhaar_front_image || !files.aadhaar_back_image) {
            setUploadError("Select both the front and back images before submitting.");
            return;
        }

        setSaving(true);
        try {
            await uploadStaffKyc(files);
            form.reset();
            setFiles({ aadhaar_front_image: null, aadhaar_back_image: null });
            setSuccess("Your Aadhaar documents were submitted successfully.");
            setReload((value) => value + 1);
        } catch (requestError) {
            setUploadError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5">
            {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-4 py-3 text-sm text-[var(--d-err)]"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
            {statusError && <p role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-4 py-3 text-sm text-[var(--d-err)]"><AlertCircle size={17} className="mt-0.5 shrink-0" />Could not load KYC status: {statusError}</p>}

            <section className="afx-card afx-rise overflow-hidden rounded-2xl" style={{ animationDelay: "80ms" }}>
                <div className="flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-glow)]/20 px-5 py-4 sm:px-6">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--d-glow)] text-[var(--d-gold)]"><FileCheck2 size={20} /></span>
                    <div>
                        <h2 className="afx-serif text-xl font-semibold">Verification details</h2>
                        <p className="text-sm text-[var(--d-muted)]">Your Aadhaar number and latest KYC review status.</p>
                    </div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    <div className="rounded-xl border border-[var(--d-line)] bg-[var(--d-card)] p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--d-muted)]">Aadhaar number</p>
                        <p className="mt-2 break-all text-lg font-semibold tracking-wide">{loading ? "Loading…" : staff?.aadhaar_number || "Not provided"}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--d-line)] bg-[var(--d-card)] p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--d-muted)]">KYC status</p>
                        <div className="mt-2">
                            {loading ? (
                                <span className="inline-flex items-center gap-2 text-sm text-[var(--d-muted)]"><Loader2 size={15} className="animate-spin" />Checking status…</span>
                            ) : (
                                <span aria-live="polite" className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${statusError ? "border-[var(--d-line)] bg-[var(--d-bg)] text-[var(--d-muted)]" : statusColors(status)}`}>
                                    {currentStatus || "Status unavailable"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="afx-card afx-rise overflow-hidden rounded-2xl" style={{ animationDelay: "140ms" }}>
                <div className="flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-glow)]/20 px-5 py-4 sm:px-6">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--d-glow)] text-[var(--d-gold)]"><ShieldCheck size={20} /></span>
                    <div>
                        <h2 className="afx-serif text-xl font-semibold">Aadhaar documents</h2>
                        <p className="text-sm text-[var(--d-muted)]">Your currently submitted front and back images.</p>
                    </div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    <DocumentCard title="Aadhaar front" imageUrl={staff?.aadhaar_front_image} />
                    <DocumentCard title="Aadhaar back" imageUrl={staff?.aadhaar_back_image} />
                </div>
            </section>

            {isApproved ? (
                <section className="afx-card afx-rise flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 sm:p-6" style={{ animationDelay: "200ms" }}>
                    <FileCheck2 size={20} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-relaxed">
                        Your KYC is approved. You can open or download the Aadhaar images above, but cannot change or resubmit them.
                    </p>
                </section>
            ) : statusError || loading ? (
                <p role="alert" className="rounded-xl border border-[var(--d-line)] bg-[var(--d-card)] p-4 text-sm text-[var(--d-muted)]">
                    KYC status must be available before documents can be submitted. Refresh this page to try again.
                </p>
            ) : (
                <section className="afx-card afx-rise overflow-hidden rounded-2xl" style={{ animationDelay: "200ms" }}>
                    <div className="flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-glow)]/20 px-5 py-4 sm:px-6">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--d-glow)] text-[var(--d-gold)]"><FileUp size={20} /></span>
                        <div>
                            <h2 className="afx-serif text-xl font-semibold">Submit or replace documents</h2>
                            <p className="text-sm text-[var(--d-muted)]">Choose both image files to send your documents for verification.</p>
                        </div>
                    </div>
                    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                ["aadhaar_front_image", "Aadhaar front image"],
                                ["aadhaar_back_image", "Aadhaar back image"],
                            ].map(([field, label]) => (
                                <label key={field} className="block rounded-xl border border-dashed border-[var(--d-line)] bg-[var(--d-bg)] p-4 text-sm font-semibold">
                                    {label} <span className="text-rose-600">*</span>
                                    <input type="file" name={field} accept="image/*" required
                                        onChange={(event) => {
                                            setFiles((current) => ({ ...current, [field]: event.target.files?.[0] || null }));
                                            setUploadError("");
                                            setSuccess("");
                                        }}
                                        className="mt-2 block w-full text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--d-glow)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--d-gold-deep)]" />
                                    {files[field] && <span className="mt-2 block truncate text-xs font-medium text-[var(--d-muted)]">{files[field].name}</span>}
                                </label>
                            ))}
                        </div>
                        {uploadError && <p role="alert" className="flex items-start gap-2 text-sm text-[var(--d-err)]"><AlertCircle size={16} className="mt-0.5 shrink-0" />{uploadError}</p>}
                        {success && <p role="status" className="flex items-start gap-2 text-sm text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{success}</p>}
                        <button type="submit" disabled={saving || loading}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--d-gold)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                            {saving ? "Submitting documents…" : "Submit Aadhaar documents"}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}
