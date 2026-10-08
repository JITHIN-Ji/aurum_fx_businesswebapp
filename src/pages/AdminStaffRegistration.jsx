import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { registerAdminStaff } from "../api/adminStaff";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", address: "" };

function Panel({ children, className = "" }) {
    return <section className={`ar-panel ${className}`}>{children}</section>;
}

function Field({ label, name, value, onChange, type = "text", autoComplete, required = true }) {
    return (
        <label htmlFor={`staff-registration-${name}`} className="block text-sm font-semibold">
            {label}{required && <span className="text-rose-600"> *</span>}
            {name === "address" ? (
                <textarea id={`staff-registration-${name}`} name={name} value={value} onChange={onChange}
                    autoComplete={autoComplete} required={required} rows={4} className="ar-input mt-1.5 !h-auto py-3" />
            ) : (
                <input id={`staff-registration-${name}`} name={name} type={type} value={value} onChange={onChange}
                    autoComplete={autoComplete} required={required} minLength={name === "password" ? 8 : undefined}
                    className="ar-input mt-1.5" />
            )}
        </label>
    );
}

export default function AdminStaffRegistration() {
    const [values, setValues] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const updateField = (event) => {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
        setError("");
        setSuccess("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);
        try {
            const result = await registerAdminStaff({
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
                phone: values.phone.trim(),
                address: values.address.trim(),
            });
            setSuccess(typeof result === "string" && result.trim() ? result : "Staff account registered successfully.");
            setValues(EMPTY_FORM);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <style>{CSS}</style>
            <div>
                <h2 className="text-3xl font-bold">Staff registration</h2>
                <p className="mt-1 text-[var(--ad-muted)]">Create a staff account for access to the field portal.</p>
            </div>

            {error && (
                <p role="alert" className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />{error}
                </p>
            )}
            {success && (
                <p role="status" className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0" />{success}
                </p>
            )}

            <Panel className="overflow-hidden !p-0">
                <h3 className="flex items-center gap-3 border-b border-[var(--ad-line)] px-6 py-4 text-lg font-bold">
                    <span className="grid size-9 place-items-center rounded bg-[#F3E4E8] text-[#862A42]"><UserPlus size={18} /></span>
                    New staff account
                </h3>
                <form onSubmit={submit} className="space-y-5 p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Full name" name="name" value={values.name} onChange={updateField} autoComplete="name" />
                        <Field label="Email" name="email" type="email" value={values.email} onChange={updateField} autoComplete="email" />
                        <Field label="Password" name="password" type="password" value={values.password} onChange={updateField} autoComplete="new-password" />
                        <Field label="Phone" name="phone" type="tel" value={values.phone} onChange={updateField} autoComplete="tel" />
                        <div className="sm:col-span-2">
                            <Field label="Address" name="address" value={values.address} onChange={updateField} autoComplete="street-address" />
                        </div>
                    </div>
                    <p className="text-xs text-[var(--ad-muted)]">Password must be at least 8 characters.</p>
                    <button type="submit" disabled={saving} className="ar-submit">
                        {saving ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
                        {saving ? "Creating staff account…" : "Register staff"}
                    </button>
                </form>
            </Panel>
        </div>
    );
}

const CSS = `
.ar-panel{background:var(--ad-card); border:1px solid var(--ad-line); border-radius:6px; box-shadow:0 1px 2px rgba(42,26,31,.06)}
.ar-input{width:100%; height:42px; padding:0 12px; border-radius:6px; border:1px solid #D8D0BC; background:#fff; font-size:14px; font-weight:400; transition:border-color .15s,box-shadow .15s}
.ar-input:focus{outline:none; border-color:#862A42; box-shadow:0 0 0 3px rgba(134,42,66,.12)}
.ar-submit{display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 20px; border-radius:6px; background:#5A1A2B; color:#fff; border:1px solid #5A1A2B; font-size:14px; font-weight:600; transition:background .15s}
.ar-submit:hover:not(:disabled){background:#6B2034}
.ar-submit:disabled{opacity:.6; cursor:wait}
`;
