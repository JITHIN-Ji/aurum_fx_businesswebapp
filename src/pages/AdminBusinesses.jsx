import { createElement, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Building2, CalendarDays, CheckCircle2, Eye, ExternalLink, Loader2, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, Trash2, UserRound, Users, X } from "lucide-react";
import INDIA_STATES_DISTRICTS from "../data/indiaStatesDistricts.json";
import { createAdminBusiness, deleteAdminBusiness, getAdminBusiness, getAdminBusinesses, updateAdminBusiness } from "../api/adminBusiness";
import { getAdminStaff, searchAdminStaffById } from "../api/adminStaff";
import GoogleMapsLinkField from "../components/GoogleMapsLinkField";

const FIELDS = [
    { name: "business_name", label: "Business name", required: true, group: "Business details" },
    { name: "business_type", label: "Business type", group: "Business details" },
    { name: "business_category", label: "Business category", required: true, group: "Business details" },
    { name: "year_established", label: "Year established", type: "number", group: "Business details" },
    { name: "owner_name", label: "Owner name", group: "Owner & contact" },
    { name: "owner_phone", label: "Contact number", type: "tel", group: "Owner & contact" },
    { name: "alternate_phone", label: "Alternate phone", type: "tel", group: "Owner & contact" },
    { name: "email", label: "Email", type: "email", group: "Owner & contact" },
    { name: "state", label: "State", required: true, group: "Location" },
    { name: "district", label: "District", required: true, group: "Location" },
    { name: "city", label: "City / place", required: true, group: "Location" },
    { name: "pincode", label: "PIN code", required: true, group: "Location" },
    { name: "address", label: "Full address", required: true, wide: true, group: "Location" },
    { name: "location_link", label: "Map / location link", type: "url", wide: true, group: "Location" },
    { name: "business_description", label: "Business description", type: "textarea", wide: true, group: "About" },
    { name: "image", label: "Business image", type: "file", wide: true, group: "About" },
];
const GROUPS = ["Business details", "Owner & contact", "Location", "About"];
const EMPTY_FORM = Object.fromEntries(FIELDS.map(({ name }) => [name, ""]));
const STATES = INDIA_STATES_DISTRICTS.map(({ state }) => state).sort((a, b) => a.localeCompare(b));
const normalize = (value) => String(value || "").trim().toLocaleLowerCase("en-IN");
const display = (value) => value || "—";
const initial = (name) => (name || "B").trim()[0].toUpperCase();
const safeExternalUrl = (value) => {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
};

function districtsFor(state) {
    return INDIA_STATES_DISTRICTS.find((item) => normalize(item.state) === normalize(state))?.districts || [];
}

function Panel({ children, className = "", delay = 0 }) {
    return <section className={`ab-panel ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</section>;
}

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{children}
        </p>
    ) : null;
}

const Loading = ({ text }) => <p className="flex items-center justify-center gap-2 py-14 text-sm text-[var(--ad-muted)]"><Loader2 size={17} className="animate-spin" /> {text}</p>;

function SectionTitle({ children }) {
    return <h3 className="flex items-center gap-3 border-b border-[var(--ad-line)] px-6 py-4 text-lg font-bold"><span className="h-5 w-1 bg-[var(--ad-gold)]" />{children}</h3>;
}

function Input({ label, value, onChange, options, required = false, type = "text", wide = false, rows = 4 }) {
    const id = `admin-business-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return (
        <label htmlFor={id} className={`block text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>
            {label}{required && <span className="text-rose-600"> *</span>}
            {type === "textarea" ? (
                <textarea id={id} rows={rows} required={required} value={value} onChange={onChange} className="ab-input mt-1.5 !h-auto py-3" />
            ) : (
                <>
                    <input id={id} type={type} list={options ? `${id}-options` : undefined} required={required}
                        min={type === "number" ? 0 : undefined} value={value} onChange={onChange} className="ab-input mt-1.5" />
                    {options && <datalist id={`${id}-options`}>{options.map((option) => <option key={option} value={option} />)}</datalist>}
                </>
            )}
        </label>
    );
}

function businessFormData(values, imageFile) {
    const formData = new FormData();
    FIELDS.forEach(({ name }) => {
        if (name === "image") return;
        const value = values[name];
        if (value !== "") formData.append(name, name === "year_established" ? String(Number(value)) : value);
    });
    if (imageFile) formData.append("image", imageFile);
    return formData;
}

function BusinessDirectory() {
    const [businesses, setBusinesses] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    const [filters, setFilters] = useState({ staffId: "", staffName: "", fromDate: "", toDate: "", state: "", district: "", city: "" });
    const [applied, setApplied] = useState({});
    const [staffMembers, setStaffMembers] = useState([]);
    const [staffFilterError, setStaffFilterError] = useState("");

    useEffect(() => {
        let active = true;
        getAdminStaff()
            .then((data) => {
                if (!Array.isArray(data?.staff)) throw new Error("The staff response has an unexpected format.");
                if (active) setStaffMembers(data.staff);
            })
            .catch((requestError) => {
                if (active) setStaffFilterError(`Staff name filtering is unavailable. ${requestError.message}`);
            });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        const request = applied.staffId
            ? searchAdminStaffById(applied.staffId).then((data) => {
                if (!Array.isArray(data?.businesses)) throw new Error("The staff search response has an unexpected business list.");
                return { businesses: data.businesses, total: Number(data.total_businesses) || data.businesses.length };
            })
            : getAdminBusinesses(Object.fromEntries(
                Object.entries(applied).filter(([key]) => ["state", "district", "city"].includes(key))
            ));

        request.then((data) => {
                if (!Array.isArray(data?.businesses)) throw new Error("The business response has an unexpected format.");
                if (active) {
                    setBusinesses(data.businesses);
                    setTotal(Number(data.total) || data.businesses.length);
                }
            })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [applied, reload]);

    const filteredBusinesses = businesses.filter((business) => {
        if (applied.staffName) {
            const staffNameQuery = normalize(applied.staffName);
            const matchingStaffIds = staffMembers
                .filter((member) => normalize(member.name).includes(staffNameQuery))
                .map((member) => normalize(member.staff_id));
            if (!matchingStaffIds.includes(normalize(business.staff_id))) return false;
        }
        const businessDate = business.created_at ? new Date(business.created_at) : null;
        if (applied.fromDate) {
            const from = new Date(`${applied.fromDate}T00:00:00`);
            if (!businessDate || Number.isNaN(businessDate.getTime()) || businessDate < from) return false;
        }
        if (applied.toDate) {
            const toExclusive = new Date(`${applied.toDate}T00:00:00`);
            toExclusive.setDate(toExclusive.getDate() + 1);
            if (!businessDate || Number.isNaN(businessDate.getTime()) || businessDate >= toExclusive) return false;
        }
        if (applied.staffId && (
            (applied.state && normalize(business.state) !== normalize(applied.state))
            || (applied.district && normalize(business.district) !== normalize(applied.district))
            || (applied.city && normalize(business.city) !== normalize(applied.city))
        )) return false;
        return true;
    });

    const districts = filters.state
        ? districtsFor(filters.state)
        : [...new Set(businesses.map((business) => business.district).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const places = [...new Set(businesses
        .filter((business) => (!filters.state || normalize(business.state) === normalize(filters.state))
            && (!filters.district || normalize(business.district) === normalize(filters.district)))
        .map((business) => business.city)
        .filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const setFilter = (key) => (event) => setFilters((current) => ({
        ...current,
        [key]: event.target.value,
        ...(key === "state" ? { district: "", city: "" } : {}),
        ...(key === "district" ? { city: "" } : {}),
    }));
    const search = (event) => {
        event.preventDefault();
        if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
            setError("The start date must be before or equal to the end date.");
            return;
        }
        setError("");
        setApplied(Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())));
    };
    const clear = () => {
        setFilters({ staffId: "", staffName: "", fromDate: "", toDate: "", state: "", district: "", city: "" });
        setApplied({});
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <style>{CSS}</style>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Business directory</h2>
                    <p className="mt-1 text-[var(--ad-muted)]">Browse, create and manage business records across the network.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setReload((value) => value + 1)} disabled={loading} className="ab-btn"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
                    <Link to="/admin/businesses/new" className="ab-btn-primary"><Plus size={17} /> Add business</Link>
                </div>
            </div>

            <Panel delay={40}>
                <form onSubmit={search} className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Input label="Staff ID" value={filters.staffId} onChange={setFilter("staffId")} />
                    <Input label="Staff name" value={filters.staffName} onChange={setFilter("staffName")}
                        options={[...new Set(staffMembers.map((member) => member.name).filter(Boolean))].sort((a, b) => a.localeCompare(b))} />
                    <Input label="From date" type="date" value={filters.fromDate} onChange={setFilter("fromDate")} />
                    <Input label="To date" type="date" value={filters.toDate} onChange={setFilter("toDate")} />
                    <Input label="State" value={filters.state} onChange={setFilter("state")} options={STATES} />
                    <Input label="District" value={filters.district} onChange={setFilter("district")} options={[...new Set(districts)].sort((a, b) => a.localeCompare(b))} />
                    <Input label="Place / city" value={filters.city} onChange={setFilter("city")} options={places} />
                    <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4">
                        <button type="submit" className="ab-btn-primary"><Search size={16} /> Search</button>
                        <button type="button" onClick={clear} className="ab-btn"><X size={16} /> Clear</button>
                    </div>
                </form>
            </Panel>

            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage>{staffFilterError}</ErrorMessage>
            {loading ? <Loading text={applied.staffId ? "Searching staff businesses…" : "Loading businesses…"} /> : filteredBusinesses.length ? (
                <Panel className="overflow-hidden !p-0" delay={100}>
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--ad-line)] px-6 py-4">
                        <p className="flex items-center gap-3 text-lg font-bold"><span className="h-5 w-1 bg-[var(--ad-gold)]" />Business records</p>
                        <span className="ab-chip">Showing {filteredBusinesses.length} of {total.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="ab-table w-full min-w-[1050px] text-left text-sm">
                            <thead><tr><th>Business</th><th>Category</th><th>Owner</th><th>Location</th><th>Map link</th><th>Staff</th><th className="text-right">Actions</th></tr></thead>
                            <tbody>
                                {filteredBusinesses.map((business) => (
                                    <tr key={business.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <span className="ab-avatar">{initial(business.business_name)}</span>
                                                <div className="min-w-0">
                                                    <Link to={`/admin/businesses/${business.id}`} className="font-semibold hover:text-[var(--ad-gold)]">{display(business.business_name)}</Link>
                                                    <p className="mt-0.5 text-xs text-[var(--ad-muted)]">{display(business.business_type)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="ab-chip">{display(business.business_category)}</span></td>
                                        <td>{display(business.owner_name)}<p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--ad-muted)]"><Phone size={11} />{display(business.owner_phone)}</p></td>
                                        <td>{[business.city, business.district].filter(Boolean).join(", ") || "—"}<p className="mt-0.5 text-xs text-[var(--ad-muted)]">{display(business.state)}</p></td>
                                        <td>
                                            {safeExternalUrl(business.location_link) ? (
                                                <a href={safeExternalUrl(business.location_link)} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ad-gold)] hover:underline">
                                                    <ExternalLink size={13} /> Open map
                                                </a>
                                            ) : "—"}
                                        </td>
                                        <td><span className="inline-flex min-w-9 justify-center rounded bg-[var(--ad-bg)] px-2.5 py-1 font-bold">{display(business.staff_id)}</span></td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/admin/businesses/${business.id}`} className="ab-btn !h-9 !px-3 !text-xs"><Eye size={14} /> View</Link>
                                                <Link aria-label={`Edit ${business.business_name}`} to={`/admin/businesses/${business.id}/edit`} className="ab-btn !h-9 !w-9 !px-0"><Pencil size={15} /></Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            ) : !error ? (
                <Panel className="py-14 text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded bg-[var(--ad-bg)]"><Building2 size={26} className="text-[var(--ad-gold)]" /></span>
                    <p className="mt-4 font-semibold">No businesses found</p>
                    <p className="mt-1 text-sm text-[var(--ad-muted)]">{Object.keys(applied).length ? "No businesses match these filters. Try adjusting them." : "Create the first business record."}</p>
                    {!Object.keys(applied).length && <Link to="/admin/businesses/new" className="ab-btn-primary mt-5"><Plus size={16} /> Add business</Link>}
                </Panel>
            ) : null}
        </div>
    );
}

function BusinessForm({ editing = false }) {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const [values, setValues] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!imageFile) {
            setImagePreview("");
            return undefined;
        }
        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

    useEffect(() => {
        if (!editing) return undefined;
        let active = true;
        getAdminBusiness(businessId)
            .then((business) => {
                if (active) setValues(Object.fromEntries(FIELDS.map(({ name }) => [name, business[name] == null ? "" : String(business[name])])));
            })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [businessId, editing]);

    const setValue = (name) => (event) => {
        setValues((current) => ({ ...current, [name]: event.target.value, ...(name === "state" ? { district: "" } : {}) }));
        setError("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        const year = Number(values.year_established);
        if (values.year_established && (!Number.isInteger(year) || year > new Date().getFullYear())) {
            setError("Enter a valid year established.");
            return;
        }
        setSaving(true);
        try {
            const data = businessFormData(values, imageFile);
            const result = editing ? await updateAdminBusiness(businessId, data) : await createAdminBusiness(data);
            setSuccess(editing ? "Business updated." : "Business created.");
            navigate(editing ? `/admin/businesses/${result.id}` : "/admin/businesses", { replace: true, state: { notice: editing ? "Business updated successfully." : "Business created successfully." } });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading text="Loading business…" />;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <style>{CSS}</style>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div><h2 className="text-3xl font-bold">{editing ? "Edit business" : "Add business"}</h2><p className="mt-1 text-[var(--ad-muted)]">{editing ? "Update the selected business record." : "Create a business record for the network."}</p></div>
                <Link to={editing ? `/admin/businesses/${businessId}` : "/admin/businesses"} className="ab-btn"><ArrowLeft size={16} /> Back</Link>
            </div>
            <ErrorMessage>{error}</ErrorMessage>
            {success && <p role="status" className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 size={17} />{success}</p>}
            <form onSubmit={submit} className="space-y-5">
                {GROUPS.map((group, index) => (
                    <Panel key={group} className="overflow-hidden !p-0" delay={index * 70}>
                        <SectionTitle>{group}</SectionTitle>
                        <div className="grid gap-5 p-6 sm:grid-cols-2">
                            {FIELDS.filter((field) => field.group === group).map((field) => {
                                const options = field.name === "state" ? STATES : field.name === "district" ? districtsFor(values.state) : undefined;
                                if (field.name === "location_link") {
                                    return (
                                        <GoogleMapsLinkField key={field.name} value={values.location_link}
                                            onChange={(locationLink) => setValues((current) => ({ ...current, location_link: locationLink }))}
                                            businessDetails={values} inputClassName="ab-input w-full"
                                            buttonClassName="inline-flex h-9 items-center gap-2 rounded border border-[var(--ad-line)] bg-[var(--ad-bg)] px-3 text-xs font-semibold text-[var(--ad-gold)] transition hover:border-[var(--ad-gold)]" />
                                    );
                                }
                                if (field.name === "image") {
                                    return (
                                        <div key={field.name} className="sm:col-span-2">
                                            <label htmlFor="admin-business-image" className="block text-sm font-semibold">Business image</label>
                                            <input id="admin-business-image" type="file" accept="image/*"
                                                onChange={(event) => { setImageFile(event.target.files?.[0] || null); setError(""); }}
                                                className="ab-input mt-1.5 !h-auto py-2.5 file:mr-4 file:cursor-pointer file:border-0 file:bg-[var(--ad-gold)] file:px-4 file:py-1.5 file:text-white" />
                                            {(imagePreview || values.image) && (
                                                <img src={imagePreview || values.image} alt="Business image preview" className="mt-4 max-h-56 max-w-full rounded border border-[var(--ad-line)] object-contain" />
                                            )}
                                            {editing && values.image && !imageFile && <p className="mt-1 text-xs text-[var(--ad-muted)]">Choose an image to replace the current image.</p>}
                                        </div>
                                    );
                                }
                                return <Input key={field.name} label={field.label} type={field.type || "text"} required={field.required} wide={field.wide}
                                    value={values[field.name]} options={options} onChange={setValue(field.name)} />;
                            })}
                        </div>
                    </Panel>
                ))}
                <button type="submit" disabled={saving} className="ab-btn-primary !h-12 !px-7">
                    {saving && <Loader2 size={17} className="animate-spin" />}{saving ? "Saving…" : editing ? "Save changes" : "Create business"}
                </button>
            </form>
        </div>
    );
}

function Tile({ icon, label, value }) {
    return (
        <div className="flex gap-3.5 rounded border border-[var(--ad-line)] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded bg-[var(--ad-bg)] text-[var(--ad-gold)]">{createElement(icon, { size: 17 })}</span>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ad-muted)]">{label}</p>
                <p className="mt-0.5 break-words text-sm font-semibold">{display(value)}</p>
            </div>
        </div>
    );
}

function BusinessDetails() {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getAdminBusiness(businessId)
            .then((data) => { if (active) setBusiness(data); })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [businessId]);

    const remove = async () => {
        if (!window.confirm(`Delete "${business.business_name}"? This cannot be undone.`)) return;
        setDeleting(true);
        setError("");
        try {
            await deleteAdminBusiness(businessId);
            navigate("/admin/businesses", { replace: true, state: { notice: "Business deleted successfully." } });
        } catch (requestError) {
            setError(requestError.message);
            setDeleting(false);
        }
    };

    if (loading) return <Loading text="Loading business…" />;
    if (!business) return <div className="space-y-4"><ErrorMessage>{error || "Business not found."}</ErrorMessage><Link to="/admin/businesses" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Business directory</Link></div>;

    const b = business;
    const locationLink = safeExternalUrl(b.location_link);
    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <style>{CSS}</style>
            <Link to="/admin/businesses" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ad-muted)] hover:text-[var(--ad-text)]"><ArrowLeft size={16} /> Business directory</Link>
            <ErrorMessage>{error}</ErrorMessage>

            <Panel className="ab-hero overflow-hidden !p-0">
                {b.image && <img src={b.image} alt={b.business_name || "Business"} className="max-h-72 w-full object-cover" />}
                <div className="flex flex-wrap items-center justify-between gap-5 p-6">
                    <div className="flex min-w-0 items-center gap-4">
                        <span className="ab-avatar !size-14 !text-xl">{initial(b.business_name)}</span>
                        <div className="min-w-0">
                            <h2 className="truncate text-2xl font-bold">{display(b.business_name)}</h2>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {b.business_category && <span className="ab-chip">{b.business_category}</span>}
                                {b.business_type && <span className="ab-chip">{b.business_type}</span>}
                                <span className="flex items-center gap-1 text-sm text-[var(--ad-muted)]"><MapPin size={14} />{[b.city, b.district, b.state].filter(Boolean).join(", ") || "Location not provided"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/admin/businesses/${businessId}/edit`} className="ab-btn"><Pencil size={15} /> Edit</Link>
                        <button type="button" onClick={remove} disabled={deleting} className="ab-btn !border-rose-200 !text-rose-700 hover:!bg-rose-600 hover:!text-white">
                            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
                        </button>
                    </div>
                </div>
            </Panel>

            <div className="grid gap-6 md:grid-cols-2">
                <Panel className="overflow-hidden !p-0" delay={60}>
                    <SectionTitle>Owner & contact</SectionTitle>
                    <div className="space-y-3 p-6">
                        <Tile icon={UserRound} label="Owner" value={b.owner_name} />
                        <Tile icon={Phone} label="Contact number" value={b.owner_phone} />
                        <Tile icon={Phone} label="Alternate phone" value={b.alternate_phone} />
                        <Tile icon={Mail} label="Email" value={b.email} />
                    </div>
                </Panel>
                <Panel className="overflow-hidden !p-0" delay={120}>
                    <SectionTitle>Location</SectionTitle>
                    <div className="space-y-3 p-6">
                        <Tile icon={MapPin} label="State" value={b.state} />
                        <Tile icon={MapPin} label="District / city" value={[b.district, b.city].filter(Boolean).join(" · ")} />
                        <Tile icon={MapPin} label="PIN code" value={b.pincode} />
                        <Tile icon={MapPin} label="Address" value={b.address} />
                        {locationLink ? (
                            <a href={locationLink} target="_blank" rel="noreferrer"
                                className="flex gap-3.5 rounded border border-[var(--ad-line)] p-4 text-[var(--ad-gold)] hover:bg-[var(--ad-bg)]">
                                <span className="grid size-9 shrink-0 place-items-center rounded bg-[var(--ad-bg)]"><ExternalLink size={17} /></span>
                                <span className="min-w-0">
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--ad-muted)]">Map / location link</span>
                                    <span className="mt-0.5 block break-all text-sm font-semibold">{locationLink}</span>
                                </span>
                            </a>
                        ) : <Tile icon={ExternalLink} label="Map / location link" value={b.location_link} />}
                    </div>
                </Panel>
            </div>

            <Panel className="overflow-hidden !p-0" delay={180}>
                <SectionTitle>About</SectionTitle>
                <div className="grid gap-3 p-6 sm:grid-cols-3">
                    <Tile icon={CalendarDays} label="Year established" value={b.year_established} />
                    <Tile icon={Users} label="Staff ID" value={b.staff_id} />
                    <Tile icon={CalendarDays} label="Created" value={b.created_at && new Date(b.created_at).toLocaleString("en-IN")} />
                    <div className="rounded border border-[var(--ad-line)] p-4 sm:col-span-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ad-muted)]">Description</p>
                        <p className="mt-1 whitespace-pre-line text-sm font-medium">{display(b.business_description)}</p>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

export default function AdminBusinesses() {
    const { businessId } = useParams();
    if (businessId) return <BusinessDetails />;
    return <BusinessDirectory />;
}

export function AdminBusinessForm({ editing = false }) {
    return <BusinessForm editing={editing} />;
}

const CSS = `
.ab-panel{background:var(--ad-card); border:1px solid var(--ad-line); border-radius:6px; padding:24px; box-shadow:0 1px 2px rgba(42,26,31,.06); animation:ab-rise .4s ease-out both}
.ab-hero{border-top:3px solid #862A42}
.ab-btn,.ab-btn-primary{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:6px; font-size:14px; font-weight:600; transition:border-color .15s,background .15s,color .15s}
.ab-btn{background:#fff; border:1px solid #D8D0BC; color:var(--ad-text)}
.ab-btn:hover:not(:disabled){border-color:#862A42; background:#FBF8F6}
.ab-btn-primary{background:#5A1A2B; color:#fff; border:1px solid #5A1A2B}
.ab-btn-primary:hover:not(:disabled){background:#6B2034}
.ab-btn:disabled,.ab-btn-primary:disabled{opacity:.6; cursor:not-allowed}
.ab-input{width:100%; height:42px; padding:0 12px; border-radius:6px; border:1px solid #D8D0BC; background:#fff; font-size:14px; font-weight:400; transition:border-color .15s,box-shadow .15s}
.ab-input:focus{outline:none; border-color:#862A42; box-shadow:0 0 0 3px rgba(134,42,66,.12)}
.ab-table th{padding:12px 20px; font-size:11.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--ad-muted); background:#FAF8F5; border-bottom:1px solid var(--ad-line); white-space:nowrap}
.ab-table td{padding:14px 20px; border-bottom:1px solid var(--ad-line); vertical-align:middle}
.ab-table tbody tr:last-child td{border-bottom:0}
.ab-table tbody tr:hover{background:#FAF8F5}
.ab-avatar{display:grid; place-items:center; width:40px; height:40px; flex:none; border-radius:6px; font-weight:700; color:#fff; background:linear-gradient(135deg,#862A42,#5A1A2B)}
.ab-chip{display:inline-block; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:600; color:#5A1A2B; background:#F3E4E8; border:1px solid #E6C3CC}
@keyframes ab-rise{from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none}}
@media(prefers-reduced-motion:reduce){.ab-panel{animation:none}}
`;