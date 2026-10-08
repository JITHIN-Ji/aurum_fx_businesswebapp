import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { updateAdminProfile } from "../api/adminLogin";

const EMPTY_FORM = { newEmail: "", confirmEmail: "", newPassword: "", confirmPassword: "" };

function Panel({ children, className = "" }) {
    return <section className={`ap-panel ${className}`}>{children}</section>;
}

function Field({ label, name, type, value, onChange, autoComplete, minLength }) {
    return (
        <label htmlFor={`admin-profile-${name}`} className="block text-sm font-semibold">
            {label}
            <input id={`admin-profile-${name}`} name={name} type={type} value={value} onChange={onChange}
                autoComplete={autoComplete} minLength={minLength} className="ap-input mt-1.5" />
        </label>
    );
}

export default function AdminProfile() {
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

        const changingEmail = Boolean(values.newEmail || values.confirmEmail);
        const changingPassword = Boolean(values.newPassword || values.confirmPassword);
        if (!changingEmail && !changingPassword) {
            setError("Enter a new email or password to update your admin profile.");
            return;
        }
        if (changingEmail && (!values.newEmail || !values.confirmEmail)) {
            setError("Enter and confirm the new email address.");
            return;
        }
        if (changingEmail && values.newEmail.trim().toLowerCase() !== values.confirmEmail.trim().toLowerCase()) {
            setError("The new email and confirmation do not match.");
            return;
        }
        if (changingPassword && (!values.newPassword || !values.confirmPassword)) {
            setError("Enter and confirm the new password.");
            return;
        }
        if (changingPassword && values.newPassword !== values.confirmPassword) {
            setError("The new password and confirmation do not match.");
            return;
        }
        if (changingPassword && values.newPassword.length < 8) {
            setError("The new password must be at least 8 characters.");
            return;
        }

        const profile = {};
        if (changingEmail) {
            profile.new_email = values.newEmail.trim();
            profile.confirm_email = values.confirmEmail.trim();
        }
        if (changingPassword) {
            profile.new_password = values.newPassword;
            profile.confirm_password = values.confirmPassword;
        }

        setSaving(true);
        try {
            const response = await updateAdminProfile(profile);
            setSuccess(typeof response === "string" && response.trim() ? response : "Admin profile updated successfully.");
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
                <h2 className="text-3xl font-bold">Admin profile</h2>
                <p className="mt-1 text-[var(--ad-muted)]">Update your admin email address or password.</p>
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

            <form onSubmit={submit} className="space-y-5">
                <Panel className="overflow-hidden">
                    <h3 className="flex items-center gap-3 border-b border-[var(--ad-line)] pb-4 text-lg font-bold">
                        <span className="grid size-9 place-items-center rounded bg-[#F3E4E8] text-[#862A42]"><Mail size={18} /></span>
                        Change email
                    </h3>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Field label="New email" name="newEmail" type="email" value={values.newEmail} onChange={updateField} autoComplete="email" />
                        <Field label="Confirm new email" name="confirmEmail" type="email" value={values.confirmEmail} onChange={updateField} autoComplete="email" />
                    </div>
                </Panel>

                <Panel className="overflow-hidden">
                    <h3 className="flex items-center gap-3 border-b border-[var(--ad-line)] pb-4 text-lg font-bold">
                        <span className="grid size-9 place-items-center rounded bg-[#F3E4E8] text-[#862A42]"><KeyRound size={18} /></span>
                        Change password
                    </h3>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Field label="New password" name="newPassword" type="password" value={values.newPassword} onChange={updateField} autoComplete="new-password" minLength={8} />
                        <Field label="Confirm new password" name="confirmPassword" type="password" value={values.confirmPassword} onChange={updateField} autoComplete="new-password" minLength={8} />
                    </div>
                    <p className="mt-3 text-xs text-[var(--ad-muted)]">Password must be at least 8 characters. Leave both password fields blank if you are only changing your email.</p>
                </Panel>

                <button type="submit" disabled={saving} className="ap-submit">
                    {saving ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                    {saving ? "Saving profile…" : "Update admin profile"}
                </button>
            </form>
        </div>
    );
}

const CSS = `
.ap-panel{background:var(--ad-card); border:1px solid var(--ad-line); border-radius:6px; padding:24px; box-shadow:0 1px 2px rgba(42,26,31,.06); animation:ap-rise .4s ease-out both}
.ap-input{width:100%; height:42px; padding:0 12px; border-radius:6px; border:1px solid #D8D0BC; background:#fff; font-size:14px; font-weight:400; transition:border-color .15s,box-shadow .15s}
.ap-input:focus{outline:none; border-color:#862A42; box-shadow:0 0 0 3px rgba(134,42,66,.12)}
.ap-submit{display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 20px; border-radius:6px; background:#5A1A2B; color:#fff; border:1px solid #5A1A2B; font-size:14px; font-weight:600; transition:background .15s}
.ap-submit:hover:not(:disabled){background:#6B2034}
.ap-submit:disabled{opacity:.6; cursor:wait}
@keyframes ap-rise{from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none}}
@media(prefers-reduced-motion:reduce){.ap-panel{animation:none}}
`;
