import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Building2, Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import INDIA_STATES_DISTRICTS from "../data/indiaStatesDistricts.json";
import { createStaffBusiness, deleteStaffBusiness, getStaffBusiness, getStaffBusinesses, updateStaffBusiness } from "../api/staffBusiness";
import GoogleMapsLinkField from "../components/GoogleMapsLinkField";

const GROUPS = ["Business", "Owner & contact", "Location", "About"];
const BUSINESS_FIELDS = [
    { name: "business_name", label: "Business name", required: true, group: 0 },
    { name: "business_type", label: "Business type", group: 0 },
    { name: "business_category", label: "Business category", required: true, group: 0 },
    { name: "year_established", label: "Year established", type: "number", group: 0 },
    { name: "owner_name", label: "Owner name", group: 1 },
    { name: "owner_phone", label: "Contact number", type: "tel", group: 1 },
    { name: "alternate_phone", label: "Alternate phone", type: "tel", group: 1 },
    { name: "email", label: "Email", type: "email", group: 1 },
    { name: "state", label: "State", required: true, group: 2 },
    { name: "district", label: "District", required: true, group: 2 },
    { name: "city", label: "City / place", required: true, group: 2 },
    { name: "pincode", label: "PIN code", required: true, group: 2 },
    { name: "address", label: "Full address", required: true, wide: true, group: 2 },
    { name: "location_link", label: "Map / location link", type: "url", wide: true, group: 2 },
    { name: "business_description", label: "Business description", type: "textarea", wide: true, group: 3 },
];

const EMPTY_FORM = Object.fromEntries(BUSINESS_FIELDS.map(({ name }) => [name, ""]));
const INDIA_STATES = INDIA_STATES_DISTRICTS.map(({ state }) => state).sort((a, b) => a.localeCompare(b));
const normalizeLocation = (value) => value.trim().toLocaleLowerCase("en-IN");
const safeExternalUrl = (value) => {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
};

function districtsForState(state) {
    return INDIA_STATES_DISTRICTS.find((item) => normalizeLocation(item.state) === normalizeLocation(state))?.districts || [];
}

function localDateValue(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function Card({ children, className = "", delay = 0 }) {
    return <section className={`afx-card afx-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</section>;
}

function PageTitle({ title, subtitle, action }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h2 className="afx-serif text-3xl font-semibold">{title}</h2>
                {subtitle && <p className="mt-1 text-[var(--d-muted)]">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-[var(--d-err)] border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-4 py-3">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />{children}
        </p>
    ) : null;
}

const Loading = ({ text }) => <p className="flex items-center gap-2 text-sm text-[var(--d-muted)]"><Loader2 size={17} className="animate-spin" /> {text}</p>;

function useBusinessList() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        getStaffBusinesses()
            .then((data) => { if (active) setBusinesses(Array.isArray(data) ? data : []); })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reload]);

    return { businesses, loading, error, refresh: () => setReload((value) => value + 1) };
}

function FilterInput({ label, id, value, onChange, options, placeholder }) {
    return (
        <label className="block text-sm font-medium">
            {label}
            <input list={id} value={value} autoComplete="off" onChange={onChange} placeholder={placeholder} className="afx-input mt-1.5" />
            <datalist id={id}>{options.map((item) => <option key={item} value={item} />)}</datalist>
        </label>
    );
}

export function StaffBusinessDirectory() {
    const { businesses, loading, error, refresh } = useBusinessList();
    const [state, setState] = useState("");
    const [district, setDistrict] = useState("");
    const [place, setPlace] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [query, setQuery] = useState({ state: "", district: "", place: "", fromDate: "", toDate: "" });

    const districts = state ? districtsForState(state) : [...new Set(businesses.map((b) => b.district).filter(Boolean))].sort();
    const places = [...new Set(businesses
        .filter((b) => (!state || normalizeLocation(b.state || "") === normalizeLocation(state))
            && (!district || normalizeLocation(b.district || "") === normalizeLocation(district)))
        .map((b) => b.city).filter(Boolean))].sort();
    const filtered = businesses.filter((b) =>
        (!query.state || normalizeLocation(b.state || "") === normalizeLocation(query.state))
        && (!query.district || normalizeLocation(b.district || "") === normalizeLocation(query.district))
        && (!query.place || normalizeLocation(b.city || "").includes(normalizeLocation(query.place)))
        && (!query.fromDate || localDateValue(b.created_at) >= query.fromDate)
        && (!query.toDate || localDateValue(b.created_at) <= query.toDate));

    const hasFilters = Object.values(query).some(Boolean);
    const search = (event) => { event.preventDefault(); setQuery({ state, district, place, fromDate, toDate }); };
    const clear = () => {
        setState("");
        setDistrict("");
        setPlace("");
        setFromDate("");
        setToDate("");
        setQuery({ state: "", district: "", place: "", fromDate: "", toDate: "" });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-lg font-semibold text-[var(--d-muted)]">Browse and manage the businesses you have recorded.</p>
                <Link to="/staff/businesses/new" className="afx-btn"><Plus size={17} /> Add business</Link>
            </div>

            <Card className="p-5" delay={60}>
                <form onSubmit={search} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(5,minmax(0,1fr))_auto] items-end">
                    <FilterInput label="State" id="business-filter-states" value={state} options={INDIA_STATES} placeholder="Type a state…"
                        onChange={(e) => { setState(e.target.value); setDistrict(""); setPlace(""); }} />
                    <FilterInput label="District" id="business-filter-districts" value={district} options={districts} placeholder="Type a district…"
                        onChange={(e) => { setDistrict(e.target.value); setPlace(""); }} />
                    <FilterInput label="Place / city" id="business-filter-places" value={place} options={places} placeholder="Type a place…"
                        onChange={(e) => setPlace(e.target.value)} />
                    <label className="block text-sm font-medium">
                        From date
                        <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)}
                            className="afx-input mt-1.5" />
                    </label>
                    <label className="block text-sm font-medium">
                        To date
                        <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)}
                            className="afx-input mt-1.5" />
                    </label>
                    <div className="flex gap-2">
                        <button type="submit" className="afx-btn !h-12"><Search size={17} /> Search</button>
                        {hasFilters && <button type="button" onClick={clear} className="afx-btn-ghost !h-12" aria-label="Clear filters"><X size={17} /></button>}
                    </div>
                </form>
            </Card>

            <ErrorMessage>{error}</ErrorMessage>
            {loading ? <Loading text="Loading businesses…" /> : filtered.length ? (
                <Card className="overflow-hidden" delay={120}>
                    <div className="overflow-x-auto">
                        <table className="afx-table w-full min-w-[820px] text-sm">
                            <thead><tr><th>Business</th><th>Category</th><th>Owner</th><th>Location</th><th className="text-right">Actions</th></tr></thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <span className="afx-avatar">{(b.business_name || "?")[0].toUpperCase()}</span>
                                                <div className="min-w-0">
                                                    <p className="font-medium">{b.business_name}</p>
                                                    <p className="text-xs text-[var(--d-muted)]">{b.business_type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="afx-chip">{b.business_category}</span></td>
                                        <td>
                                            <p>{b.owner_name}</p>
                                            {b.owner_phone && <p className="text-xs text-[var(--d-muted)]">{b.owner_phone}</p>}
                                        </td>
                                        <td>
                                            <p>{[b.city, b.district].filter(Boolean).join(", ") || "—"}</p>
                                            <p className="text-xs text-[var(--d-muted)]">{b.state || "—"}</p>
                                        </td>
                                        <td>
                                            <div className="flex justify-end items-center gap-2">
                                                <Link to={`/staff/businesses/${b.id}`} className="afx-btn-ghost !h-9 !px-3 text-[var(--d-gold-deep)]">View details</Link>
                                                <Link aria-label={`Edit ${b.business_name}`} to={`/staff/businesses/${b.id}/edit`} className="afx-btn-ghost !h-9 !w-9 !px-0"><Pencil size={15} /></Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="px-5 py-3 border-t border-[var(--d-line)] text-xs text-[var(--d-muted)]">Showing {filtered.length} of {businesses.length} businesses</p>
                </Card>
            ) : (
                <Card className="p-12 text-center">
                    <span className="mx-auto grid place-items-center size-14 bg-[var(--d-glow)]"><Building2 size={26} className="text-[var(--d-gold)]" /></span>
                    <p className="mt-4 text-[var(--d-muted)]">{businesses.length ? "No businesses match those filters." : "No businesses found yet."}</p>
                    {businesses.length > 0
                        ? <button type="button" onClick={clear} className="mt-3 text-sm text-[var(--d-gold-deep)] hover:underline">Clear filters</button>
                        : <Link to="/staff/businesses/new" className="afx-btn mt-4">Add your first business</Link>}
                </Card>
            )}
            {error && <button type="button" onClick={refresh} className="text-sm text-[var(--d-gold-deep)] hover:underline">Retry loading businesses</button>}
        </div>
    );
}

function toFormData(values, imageFile) {
    const body = new FormData();
    for (const { name } of BUSINESS_FIELDS) {
        const value = values[name];
        if (name === "year_established") {
            if (value) body.append(name, String(Number(value)));
        } else if (value !== "") {
            body.append(name, value);
        }
    }
    if (imageFile) body.append("image", imageFile);
    return body;
}

function BusinessField({ field, value, onChange, suggestions }) {
    const listId = `business-${field.name}-suggestions`;
    return (
        <label className={`block text-sm font-medium ${field.wide ? "sm:col-span-2" : ""}`}>
            {field.label}{field.required && <span className="text-[var(--d-err)]"> *</span>}
            {field.type === "textarea" ? (
                <textarea rows={4} required={field.required} value={value} onChange={onChange} className="afx-input mt-1.5" />
            ) : (
                <>
                    <input type={field.type || "text"} list={suggestions ? listId : undefined} required={field.required}
                        min={field.type === "number" ? 1800 : undefined} max={field.type === "number" ? new Date().getFullYear() : undefined}
                        value={value} onChange={onChange} className="afx-input mt-1.5" />
                    {suggestions && <datalist id={listId}>{suggestions.map((item) => <option key={item} value={item} />)}</datalist>}
                </>
            )}
        </label>
    );
}

export function StaffBusinessForm({ editing = false }) {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const [values, setValues] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const districtSuggestions = districtsForState(values.state);

    useEffect(() => {
        if (!editing) return undefined;
        let active = true;
        getStaffBusiness(businessId)
            .then((business) => {
                if (!active) return;
                setValues(Object.fromEntries(BUSINESS_FIELDS.map(({ name }) => [name, business[name] == null ? "" : String(business[name])])));
            })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [businessId, editing]);

    const updateField = (name) => (event) => {
        const value = event.target.value;
        setValues((current) => name === "state" ? { ...current, state: value, district: "" } : { ...current, [name]: value });
        setError("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        const year = values.year_established;
        if (year && (!Number.isInteger(Number(year)) || Number(year) > new Date().getFullYear())) {
            setError("Enter a valid year established.");
            return;
        }
        setSaving(true);
        try {
            const payload = toFormData(values, imageFile);
            const business = editing ? await updateStaffBusiness(businessId, payload) : await createStaffBusiness(payload);
            navigate(editing ? `/staff/businesses/${business.id}` : "/staff/businesses", {
                replace: true,
                state: { notice: editing ? "Business updated successfully." : "Business created successfully." },
            });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading text="Loading business…" />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageTitle
                title={editing ? "Edit business" : "Add a business"}
                subtitle={editing ? "Update this business record." : "Record a business in the directory."}
                action={<Link to={editing ? `/staff/businesses/${businessId}` : "/staff/businesses"} className="afx-btn-ghost"><ArrowLeft size={16} /> Back</Link>}
            />
            <form onSubmit={submit} className="space-y-6">
                <ErrorMessage>{error}</ErrorMessage>
                {GROUPS.map((group, gi) => (
                    <Card key={group} delay={60 + gi * 70}>
                        <h3 className="afx-serif text-lg font-semibold px-6 py-4 border-b border-[var(--d-line)] flex items-center gap-3">
                            <span className="w-1 h-5 bg-[var(--d-gold)]" />{group}
                        </h3>
                        <div className="p-6 grid sm:grid-cols-2 gap-5">
                            {BUSINESS_FIELDS.filter((f) => f.group === gi).map((field) => field.name === "location_link" ? (
                                <GoogleMapsLinkField key={field.name} value={values.location_link}
                                    onChange={(locationLink) => setValues((current) => ({ ...current, location_link: locationLink }))}
                                    businessDetails={values} inputClassName="afx-input w-full"
                                    buttonClassName="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--d-line)] bg-[var(--d-card)] px-3 text-xs font-semibold text-[var(--d-gold-deep)] transition hover:border-[var(--d-gold)]" />
                            ) : (
                                <BusinessField key={field.name} field={field} value={values[field.name]} onChange={updateField(field.name)}
                                    suggestions={field.name === "state" ? INDIA_STATES : field.name === "district" && values.state ? districtSuggestions : undefined} />
                            ))}
                            {gi === 3 && (
                                <label className="block text-sm font-medium sm:col-span-2">
                                    Business image
                                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="afx-input !h-auto mt-1.5 py-2.5 text-sm text-[var(--d-muted)] file:mr-4 file:border-0 file:bg-[var(--d-gold)] file:px-4 file:py-1.5 file:text-white file:cursor-pointer" />
                                    {editing && values.image && <span className="mt-1 block text-xs text-[var(--d-muted)]">Choose an image to replace the current image.</span>}
                                </label>
                            )}
                        </div>
                    </Card>
                ))}
                <button type="submit" disabled={saving} className="afx-btn !h-12 !px-7">
                    {saving && <Loader2 size={17} className="animate-spin" />}
                    {saving ? "Saving…" : editing ? "Save changes" : "Create business"}
                </button>
            </form>
        </div>
    );
}

function DetailGrid({ title, rows, delay }) {
    return (
        <Card delay={delay}>
            <h3 className="afx-serif text-lg font-semibold px-6 py-4 border-b border-[var(--d-line)] flex items-center gap-3"><span className="w-1 h-5 bg-[var(--d-gold)]" />{title}</h3>
            <dl className="grid sm:grid-cols-2 gap-6 p-6">
                {rows.map(([label, value, wide]) => (
                    <div key={label} className={wide ? "sm:col-span-2" : ""}>
                        <dt className="text-xs text-[var(--d-muted)]">{label}</dt>
                        <dd className="mt-1 text-sm font-medium break-words">
                            {label === "Map / location link" && value
                                ? <a href={value} target="_blank" rel="noreferrer" className="text-[var(--d-gold-deep)] hover:underline">Open map location</a>
                                : value || "—"}
                        </dd>
                    </div>
                ))}
            </dl>
        </Card>
    );
}

export function StaffBusinessDetails() {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getStaffBusiness(businessId)
            .then((record) => { if (active) setBusiness(record); })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [businessId]);

    const remove = async () => {
        if (!window.confirm(`Delete "${business.business_name}"? This cannot be undone.`)) return;
        setError("");
        setDeleting(true);
        try {
            await deleteStaffBusiness(businessId);
            navigate("/staff/businesses", { replace: true, state: { notice: "Business deleted successfully." } });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <Loading text="Loading business…" />;

    const b = business;
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link to="/staff/businesses" className="inline-flex items-center gap-2 text-sm text-[var(--d-gold-deep)] hover:underline"><ArrowLeft size={16} /> Business directory</Link>
            <ErrorMessage>{error}</ErrorMessage>
            {b && (
                <>
                    <Card className="overflow-hidden">
                        {b.image && <img src={b.image} alt={b.business_name} className="w-full max-h-72 object-cover" />}
                        <div className="p-6 flex flex-wrap items-center justify-between gap-5">
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="afx-avatar !size-14 text-xl afx-serif">{(b.business_name || "?")[0].toUpperCase()}</span>
                                <div className="min-w-0">
                                    <h2 className="afx-serif text-2xl font-semibold truncate">{b.business_name}</h2>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        <span className="afx-chip">{b.business_category}</span>
                                        <span className="afx-chip">{b.business_type}</span>
                                        {(b.city || b.district) && <span className="flex items-center gap-1 text-sm text-[var(--d-muted)]"><MapPin size={14} />{[b.city, b.district].filter(Boolean).join(", ")}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Link to={`/staff/businesses/${businessId}/edit`} className="afx-btn-ghost"><Pencil size={16} /> Edit</Link>
                                <button type="button" onClick={remove} disabled={deleting} className="afx-btn-danger">
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                                </button>
                            </div>
                        </div>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <DetailGrid title="Owner & contact" delay={80} rows={[
                            ["Owner", b.owner_name], ["Contact number", b.owner_phone],
                            ["Alternate phone", b.alternate_phone], ["Email", b.email, true],
                        ]} />
                        <DetailGrid title="Location" delay={140} rows={[
                            ["State", b.state], ["District", b.district],
                            ["City / place", b.city], ["PIN code", b.pincode], ["Address", b.address, true],
                            ["Map / location link", safeExternalUrl(b.location_link)],
                        ]} />
                    </div>
                    <DetailGrid title="About" delay={200} rows={[
                        ["Year established", b.year_established],
                        ["Staff ID", b.staff_id],
                        ["Created", b.created_at && new Date(b.created_at).toLocaleString("en-IN")],
                        ["Description", b.business_description, true],
                    ]} />
                </>
            )}
        </div>
    );
}