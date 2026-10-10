import { createElement, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { getStaffKycStatus, getStaffProfile, updateStaffProfile, uploadStaffKyc } from "../api/staffAuth";

function Section({ icon, title, text, children, delay }) {
    return (
        <section className="afx-card afx-rise overflow-hidden rounded-xl" style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-glow)]/20 px-5 py-4 sm:px-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--d-glow)] text-[var(--d-gold)]">
                    {createElement(icon, { size: 19, strokeWidth: 1.7 })}
                </span>
                <div className="min-w-0">
                    <h2 className="afx-serif text-xl font-semibold">{title}</h2>
                    <p className="text-sm leading-relaxed text-[var(--d-muted)]">{text}</p>
                </div>
            </div>
            <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">{children}</dl>
        </section>
    );
}

function ProfileDetail({ icon, label, value, wide = false }) {
    return (
        <div className={`min-w-0 rounded-xl border border-[var(--d-line)] bg-[var(--d-glow)]/20 p-4 transition-colors hover:bg-[var(--d-glow)]/35 ${wide ? "sm:col-span-2" : ""}`}>
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--d-muted)]">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--d-card)] text-[var(--d-gold)]">
                    {createElement(icon, { size: 15 })}
                </span>
                {label}
            </dt>
            <dd className="mt-3 break-words text-base font-semibold text-[var(--d-text)]">{value || "Not provided"}</dd>
        </div>
    );
}

function ProfileImage({ label, src }) {
    return (
        <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--d-muted)]">{label}</p>
            {src ? (
                <>
                    <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-[var(--d-line)] bg-white">
                        <img src={src} alt={label} loading="lazy" className="h-52 w-full object-contain p-2" />
                    </a>
                    <a href={src} download className="mt-2 inline-flex text-sm font-semibold text-[var(--d-gold-deep)] hover:underline">
                        Download image
                    </a>
                </>
            ) : (
                <p className="grid h-52 place-items-center rounded-lg border border-dashed border-[var(--d-line)] text-sm text-[var(--d-muted)]">No image on file</p>
            )}
        </div>
    );
}

function formatKycStatus(status) {
    if (typeof status === "string" && status.trim()) return status.trim();
    if (status && typeof status === "object") {
        const message = status.status || status.kyc_status || status.verification_status || status.message || status.detail;
        if (typeof message === "string" && message.trim()) return message.trim();
        if (message && typeof message === "object") return formatKycStatus(message);
        return JSON.stringify(status);
    }
    return "No KYC status returned by the server.";
}

function kycStatusStyle(status) {
    const value = formatKycStatus(status).toLocaleUpperCase("en-IN");
    if (value.includes("APPROVED")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (value.includes("PENDING") || value.includes("REJECTED")) return "border-rose-200 bg-rose-50 text-rose-800";
    return "border-[var(--d-line)] bg-[var(--d-card)] text-[var(--d-text)]";
}

export default function StaffProfile() {
    const [staff, setStaff] = useState(null);
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [kycStatus, setKycStatus] = useState(null);
    const [kycStatusLoading, setKycStatusLoading] = useState(true);
    const [kycStatusError, setKycStatusError] = useState("");
    const [kycFiles, setKycFiles] = useState({ aadhaar_front_image: null, aadhaar_back_image: null });
    const [kycSaving, setKycSaving] = useState(false);
    const [kycError, setKycError] = useState("");
    const [kycSuccess, setKycSuccess] = useState("");

    useEffect(() => {
        let active = true;
        getStaffProfile()
            .then((data) => {
                if (active) {
                    setStaff(data);
                    setEmail(data.email || "");
                    setAddress(data.address || "");
                }
            })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });

        getStaffKycStatus()
            .then((status) => { if (active) setKycStatus(status); })
            .catch((requestError) => { if (active) setKycStatusError(requestError.message); })
            .finally(() => { if (active) setKycStatusLoading(false); });

        return () => { active = false; };
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);
        try {
            const updated = await updateStaffProfile({ email: email.trim(), address: address.trim() });
            setStaff((current) => ({ ...current, ...updated }));
            setEmail(updated.email ?? email.trim());
            setAddress(updated.address ?? address.trim());
            setSuccess("Your email and address were updated.");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const submitKyc = async (event) => {
        event.preventDefault();
        setKycError("");
        setKycSuccess("");
        if (kycStatusLoading || kycStatusError) {
            setKycError("KYC status is unavailable. Refresh the page before submitting documents.");
            return;
        }
        if (formatKycStatus(kycStatus).toLocaleUpperCase("en-IN").includes("APPROVED")) {
            setKycError("Your KYC is approved. You can download your Aadhaar images, but cannot change or resubmit them.");
            return;
        }
        if (!kycFiles.aadhaar_front_image || !kycFiles.aadhaar_back_image) {
            setKycError("Choose both the Aadhaar front and back images.");
            return;
        }

        setKycSaving(true);
        try {
            const result = await uploadStaffKyc(kycFiles);
            setKycStatus(result);
            setKycFiles({ aadhaar_front_image: null, aadhaar_back_image: null });
            setKycSuccess("Aadhaar images uploaded. Your KYC status has been updated.");
            setKycStatusError("");
            getStaffKycStatus()
                .then(setKycStatus)
                .catch((requestError) => setKycStatusError(requestError.message));
            getStaffProfile()
                .then((updated) => setStaff((current) => ({ ...current, ...updated })))
                .catch((requestError) => setError(requestError.message));
        } catch (requestError) {
            setKycError(requestError.message);
        } finally {
            setKycSaving(false);
        }
    };

    const name = staff?.name?.trim() || "Field staff";
    const initial = (name[0] || "F").toUpperCase();
    const kycApproved = !kycStatusLoading && !kycStatusError
        && formatKycStatus(kycStatus).toLocaleUpperCase("en-IN").includes("APPROVED");

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5">
            <div className="afx-card afx-rise relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-xl border-t-2 border-t-[var(--d-gold)] p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-[var(--d-glow)] blur-2xl" />
                <div className="relative flex min-w-0 items-center gap-4 sm:gap-5">
                    <span className="afx-avatar !size-14 rounded-lg afx-serif text-2xl sm:!size-16">{initial}</span>
                    <div className="min-w-0">
                        <h1 className="afx-serif truncate text-2xl font-semibold sm:text-3xl">{name}</h1>
                        <p className="mt-1 text-sm text-[var(--d-muted)]">
                            {staff?.staff_id ? `Staff ID: ${staff.staff_id}` : "Field staff profile"}
                            {staff?.role ? ` · ${staff.role}` : ""}
                        </p>
                    </div>
                </div>
                {staff?.email && (
                    <span className="relative inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--d-line)] bg-[var(--d-card)] px-3 py-2 text-sm text-[var(--d-muted)]">
                        <Mail size={15} className="shrink-0 text-[var(--d-gold)]" />
                        <span className="truncate">{staff.email}</span>
                    </span>
                )}
            </div>

            {error && (
                <p role="alert" className="flex items-start gap-2 border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-4 py-3 text-sm text-[var(--d-err)]">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />{error}
                </p>
            )}
            {success && (
                <p role="status" className="flex items-start gap-2 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0" />{success}
                </p>
            )}

            {loading ? (
                <p className="flex items-center gap-2 text-sm text-[var(--d-muted)]">
                    <Loader2 size={17} className="animate-spin" /> Loading profile…
                </p>
            ) : staff ? (
                <>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="afx-card afx-rise overflow-hidden rounded-2xl border-t-2 border-t-[var(--d-gold)]" style={{ animationDelay: "80ms" }}>
                            <div className="flex items-center gap-4 border-b border-[var(--d-line)] bg-[var(--d-glow)]/20 px-5 py-5 sm:px-7">
                                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--d-card)] text-[var(--d-gold)] shadow-sm">
                                    <UserRound size={22} strokeWidth={1.7} />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="afx-serif text-xl font-semibold sm:text-2xl">Personal details</h2>
                                    <p className="mt-1 text-sm leading-relaxed text-[var(--d-muted)]">Update your email and address. Your name and phone are read-only.</p>
                                </div>
                            </div>
                            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:gap-6 sm:p-7">
                                <ProfileDetail icon={UserRound} label="Name" value={staff.name} />
                                <ProfileDetail icon={Phone} label="Phone" value={staff.phone} />
                                <label className="block min-w-0 text-sm font-medium">
                                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--d-muted)]"><Mail size={15} className="text-[var(--d-gold)]" />Email address</span>
                                    <input type="email" name="email" autoComplete="email" required value={email}
                                        onChange={(event) => { setEmail(event.target.value); setSuccess(""); }}
                                        className="h-12 w-full rounded-xl border border-[var(--d-line)] bg-[var(--d-bg)] px-4 text-sm text-[var(--d-text)] transition placeholder:text-[var(--d-muted)] hover:border-[var(--d-gold)] focus:border-[var(--d-gold)] focus:outline-none focus:ring-4 focus:ring-[var(--d-glow)]" />
                                </label>
                                <label className="block min-w-0 text-sm font-medium sm:col-span-2">
                                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--d-muted)]"><MapPin size={15} className="text-[var(--d-gold)]" />Address</span>
                                    <textarea name="address" rows={4} value={address}
                                        onChange={(event) => { setAddress(event.target.value); setSuccess(""); }}
                                        className="w-full resize-y rounded-xl border border-[var(--d-line)] bg-[var(--d-bg)] px-4 py-3 text-sm leading-relaxed text-[var(--d-text)] transition placeholder:text-[var(--d-muted)] hover:border-[var(--d-gold)] focus:border-[var(--d-gold)] focus:outline-none focus:ring-4 focus:ring-[var(--d-glow)]" />
                                </label>
                            </div>
                            <div className="flex flex-col gap-3 border-t border-[var(--d-line)] bg-[var(--d-glow)]/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                <p className="text-xs text-[var(--d-muted)]">Keep your contact details up to date.</p>
                                <button type="submit" disabled={saving || loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--d-gold)] px-6 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-md disabled:cursor-wait disabled:opacity-60">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {saving ? "Saving changes…" : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </form>
                    <Section icon={ShieldCheck} title="Account details" text="Your field staff account information." delay={160}>
                        <ProfileDetail icon={ShieldCheck} label="Staff ID" value={staff.staff_id} />
                        <ProfileDetail icon={ShieldCheck} label="Role" value={staff.role} />
                        <ProfileDetail icon={MapPin} label="State" value={staff.state} />
                        <ProfileDetail icon={MapPin} label="District" value={staff.district} />
                        <ProfileDetail icon={ShieldCheck} label="Aadhaar number" value={staff.aadhaar_number} wide />
                    </Section>
                    <section className="afx-card afx-rise overflow-hidden rounded-xl" style={{ animationDelay: "240ms" }}>
                        <div className="flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-glow)]/20 px-5 py-4 sm:px-6">
                            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--d-glow)] text-[var(--d-gold)]">
                                <ShieldCheck size={19} strokeWidth={1.7} />
                            </span>
                            <div className="min-w-0">
                                <h2 className="afx-serif text-xl font-semibold">Aadhaar documents</h2>
                                <p className="text-sm leading-relaxed text-[var(--d-muted)]">View, download, and manage your Aadhaar documents.</p>
                            </div>
                        </div>
                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="rounded-lg border border-[var(--d-line)] bg-[var(--d-glow)]/30 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--d-muted)]">KYC status</p>
                                <p aria-live="polite" className={`mt-2 inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${kycStatusLoading || kycStatusError ? "border-[var(--d-line)] bg-[var(--d-card)] text-[var(--d-muted)]" : kycStatusStyle(kycStatus)}`}>
                                    {kycStatusLoading ? "Checking status…" : kycStatusError ? "Status unavailable" : formatKycStatus(kycStatus)}
                                </p>
                                {kycStatusError && <p role="alert" className="mt-1 text-sm text-[var(--d-err)]">{kycStatusError}</p>}
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <ProfileImage label="Aadhaar front" src={staff.aadhaar_front_image} />
                                <ProfileImage label="Aadhaar back" src={staff.aadhaar_back_image} />
                            </div>
                            {kycApproved ? (
                                <p className="border-t border-[var(--d-line)] pt-5 text-sm font-medium text-emerald-800">
                                    Your KYC is approved. You can download the Aadhaar images above, but cannot change or resubmit them.
                                </p>
                            ) : kycStatusLoading || kycStatusError ? null : (
                                <form onSubmit={submitKyc} className="space-y-4 border-t border-[var(--d-line)] pt-5">
                                    <p className="text-sm text-[var(--d-muted)]">
                                        Choose both sides to submit or replace your Aadhaar documents. Once approved, documents can only be downloaded.
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            ["aadhaar_front_image", "Aadhaar front image"],
                                            ["aadhaar_back_image", "Aadhaar back image"],
                                        ].map(([field, label]) => (
                                            <label key={field} className="block text-sm font-medium">
                                                {label} <span className="text-rose-600">*</span>
                                                <input type="file" name={field} accept="image/*" required
                                                    onChange={(event) => {
                                                        setKycFiles((current) => ({ ...current, [field]: event.target.files?.[0] || null }));
                                                        setKycError("");
                                                        setKycSuccess("");
                                                    }}
                                                    className="mt-1.5 block w-full rounded-lg border border-[var(--d-line)] bg-[var(--d-card)] px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--d-glow)] file:px-3 file:py-1.5 file:text-sm file:font-semibold" />
                                            </label>
                                        ))}
                                    </div>
                                    {kycError && <p role="alert" className="flex items-start gap-2 text-sm text-[var(--d-err)]"><AlertCircle size={16} className="mt-0.5 shrink-0" />{kycError}</p>}
                                    {kycSuccess && <p role="status" className="flex items-start gap-2 text-sm text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{kycSuccess}</p>}
                                    <button type="submit" disabled={kycSaving} className="inline-flex h-11 items-center gap-2 rounded bg-[var(--d-gold)] px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">
                                        {kycSaving ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                                        {kycSaving ? "Uploading Aadhaar images…" : "Submit Aadhaar images"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                </>
            ) : null}
        </div>
    );
}
