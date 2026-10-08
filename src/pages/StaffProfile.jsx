import { createElement, useEffect, useState } from "react";
import { AlertCircle, Loader2, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { getStaffProfile } from "../api/staffAuth";

function Section({ icon, title, text, children, delay }) {
    return (
        <section className="afx-card afx-rise" style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center gap-3 border-b border-[var(--d-line)] px-6 py-5">
                <span className="grid size-10 place-items-center bg-[var(--d-glow)] text-[var(--d-gold)]">
                    {createElement(icon, { size: 19, strokeWidth: 1.7 })}
                </span>
                <div>
                    <h2 className="afx-serif text-xl font-semibold">{title}</h2>
                    <p className="text-sm text-[var(--d-muted)]">{text}</p>
                </div>
            </div>
            <dl className="grid gap-5 p-6 sm:grid-cols-2">{children}</dl>
        </section>
    );
}

function ProfileDetail({ icon, label, value, wide = false }) {
    return (
        <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--d-muted)]">
                {createElement(icon, { size: 14 })}{label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium">{value || "Not provided"}</dd>
        </div>
    );
}

export default function StaffProfile() {
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getStaffProfile()
            .then((data) => { if (active) setStaff(data); })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const name = staff?.name?.trim() || "Field staff";
    const initial = (name[0] || "F").toUpperCase();

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="afx-card afx-rise flex items-center gap-5 p-6">
                <span className="afx-avatar !size-16 afx-serif text-2xl">{initial}</span>
                <div className="min-w-0">
                    <h1 className="afx-serif truncate text-2xl font-semibold">{name}</h1>
                    <p className="text-sm text-[var(--d-muted)]">
                        {staff?.staff_id ? `Staff ID: ${staff.staff_id}` : "Field staff profile"}
                        {staff?.role ? ` · ${staff.role}` : ""}
                    </p>
                </div>
            </div>

            {error && (
                <p role="alert" className="flex items-start gap-2 border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-4 py-3 text-sm text-[var(--d-err)]">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />{error}
                </p>
            )}

            {loading ? (
                <p className="flex items-center gap-2 text-sm text-[var(--d-muted)]">
                    <Loader2 size={17} className="animate-spin" /> Loading profile…
                </p>
            ) : staff ? (
                <>
                    <Section icon={UserRound} title="Personal details" text="Your profile information." delay={80}>
                        <ProfileDetail icon={UserRound} label="Name" value={staff.name} />
                        <ProfileDetail icon={Mail} label="Email" value={staff.email} />
                        <ProfileDetail icon={Phone} label="Phone" value={staff.phone} />
                        <ProfileDetail icon={MapPin} label="Address" value={staff.address} wide />
                    </Section>
                    <Section icon={ShieldCheck} title="Account details" text="Your field staff account information." delay={160}>
                        <ProfileDetail icon={ShieldCheck} label="Staff ID" value={staff.staff_id} />
                        <ProfileDetail icon={ShieldCheck} label="Role" value={staff.role} />
                    </Section>
                </>
            ) : null}
        </div>
    );
}
