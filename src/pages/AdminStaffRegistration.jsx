import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { registerAdminStaff } from "../api/adminStaff";
import AadhaarImageUpload from "../components/AadhaarImageUpload";
import indiaStatesDistricts from "../data/indiaStatesDistricts.json";

const EMPTY_FORM = {
    name: "",
    email: "",
    password: "",
    phone: "",
    guardian_contact_number: "",
    address: "",
    aadhaar_number: "",
    state: "",
    district: "",
    aadhaar_front_image: null,
    aadhaar_back_image: null,
};

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
    const districts = indiaStatesDistricts.find(({ state }) => state === values.state)?.districts || [];

    const updateField = (event) => {
        const { name } = event.target;
        const value = name === "aadhaar_number"
            ? event.target.value.replace(/\D/g, "").slice(0, 12)
            : event.target.value;
        setValues((current) => ({
            ...current,
            [name]: value,
            ...(name === "state" ? { district: "" } : {}),
        }));
        setError("");
        setSuccess("");
    };

    const updateFile = (event) => {
        const { name, files } = event.target;
        setValues((current) => ({ ...current, [name]: files?.[0] || null }));
        setError("");
        setSuccess("");
    };

    const removeFile = (name) => {
        setValues((current) => ({ ...current, [name]: null }));
        setError("");
        setSuccess("");
    };

    const submit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setError("");
        setSuccess("");
        if (!/^\d{12}$/.test(values.aadhaar_number)) {
            setError("Aadhaar number must contain exactly 12 digits.");
            return;
        }
        setSaving(true);
        try {
            const result = await registerAdminStaff({
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
                phone: values.phone.trim(),
                guardian_contact_number: values.guardian_contact_number.trim(),
                address: values.address.trim(),
                aadhaar_number: values.aadhaar_number.trim(),
                state: values.state,
                district: values.district,
                aadhaar_front_image: values.aadhaar_front_image,
                aadhaar_back_image: values.aadhaar_back_image,
            });
            setSuccess(typeof result === "string" && result.trim() ? result : "Staff account registered successfully.");
            form.reset();
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
                        <Field label="Guardian contact number" name="guardian_contact_number" type="tel" value={values.guardian_contact_number} onChange={updateField} />
                        <label htmlFor="staff-registration-aadhaar_number" className="block text-sm font-semibold">
                            Aadhaar number <span className="text-rose-600"> *</span>
                            <input id="staff-registration-aadhaar_number" name="aadhaar_number" type="text" inputMode="numeric"
                                pattern="[0-9]{12}" maxLength={12} required value={values.aadhaar_number} onChange={updateField}
                                className="ar-input mt-1.5" />
                            <span className="mt-1 block text-xs font-normal text-[var(--ad-muted)]">Enter exactly 12 digits.</span>
                        </label>
                        <label htmlFor="staff-registration-state" className="block text-sm font-semibold">
                            State <span className="text-rose-600"> *</span>
                            <select id="staff-registration-state" name="state" required value={values.state} onChange={updateField} className="ar-input mt-1.5">
                                <option value="">Select state</option>
                                {indiaStatesDistricts.map(({ state }) => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </label>
                        <label htmlFor="staff-registration-district" className="block text-sm font-semibold">
                            District <span className="text-rose-600"> *</span>
                            <select id="staff-registration-district" name="district" required value={values.district} onChange={updateField}
                                disabled={!values.state} className="ar-input mt-1.5 disabled:cursor-not-allowed disabled:bg-gray-100">
                                <option value="">Select district</option>
                                {districts.map((district) => <option key={district} value={district}>{district}</option>)}
                            </select>
                        </label>
                        <div className="sm:col-span-2">
                            <div className="mb-3">
                                <h4 className="text-sm font-bold">Aadhaar documents</h4>
                                <p className="mt-1 text-xs text-[var(--ad-muted)]">Aadhaar images are optional. You can add them now or later.</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <AadhaarImageUpload name="aadhaar_front_image" title="Front side" file={values.aadhaar_front_image}
                                    onChange={updateFile} onRemove={removeFile} />
                                <AadhaarImageUpload name="aadhaar_back_image" title="Back side" file={values.aadhaar_back_image}
                                    onChange={updateFile} onRemove={removeFile} />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="Address" name="address" value={values.address} onChange={updateField} autoComplete="street-address" />
                        </div>
                    </div>
                    <p className="text-xs text-[var(--ad-muted)]">Password must be at least 8 characters.</p>
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
