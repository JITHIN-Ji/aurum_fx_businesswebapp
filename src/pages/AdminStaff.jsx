import { createElement, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Building2, CalendarDays, Eye, Loader2, Mail, MapPin, Pencil, Phone, Printer, RefreshCw, Search, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { getAdminStaff, getAdminStaffMember, getAdminStaffPrint, updateAdminStaffProfile, updateAdminStaffStatus } from "../api/adminStaff";
import AadhaarImageUpload from "../components/AadhaarImageUpload";
import indiaStatesDistricts from "../data/indiaStatesDistricts.json";

const formatDate = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const isActive = (status) => String(status || "").toLowerCase() === "active";
const display = (value) => value || "Not provided";
const initials = (name) => (name || "S").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{children}
        </p>
    ) : null;
}

function StatusBadge({ status }) {
    const active = isActive(status);
    return (
        <span className={`inline-flex items-center gap-2 rounded px-2.5 py-1 text-xs font-semibold ring-1 ${active ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-rose-200"}`}>
            <span className={`size-1.5 rounded-full ${active ? "as-live bg-emerald-600" : "bg-rose-600"}`} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function StatusToggle({ member, onUpdated }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const active = isActive(member.status);

    const toggle = async () => {
        setSaving(true);
        setError("");
        try {
            const nextStatus = active ? "Deactivate" : "Active";
            const result = await updateAdminStaffStatus(member.id, nextStatus);
            onUpdated(result.staff || { ...member, status: nextStatus });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <button type="button" disabled={saving} onClick={toggle}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded px-4 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${active ? "border border-rose-200 bg-white text-rose-700 hover:bg-rose-600 hover:text-white" : "bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-md shadow-emerald-900/20 hover:brightness-110"}`}>
                {active ? <UserX size={14} /> : <UserCheck size={14} />}
                {saving ? "Updating…" : active ? "Deactivate" : "Activate"}
            </button>
            {error && <p role="alert" className="mt-1 max-w-[200px] text-xs text-red-700">{error}</p>}
        </div>
    );
}

function Panel({ children, className = "", delay = 0 }) {
    return <section className={`as-panel ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</section>;
}

function Stat({ label, value, icon, tone, loading }) {
    return (
        <div className="flex items-center gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded" style={{ background: tone.bg, color: tone.fg }}>{createElement(icon, { size: 20, strokeWidth: 1.8 })}</span>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ad-muted)]">{label}</p>
                <p className="text-2xl font-bold">{loading ? "—" : value.toLocaleString("en-IN")}</p>
            </div>
        </div>
    );
}

const STRIP = "as-panel !p-0 grid divide-y divide-[var(--ad-line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0";

const FILTERS = [["all", "All"], ["active", "Active"], ["inactive", "Inactive"]];
const STAFF_STATES = indiaStatesDistricts.map(({ state }) => state);
const STAFF_DISTRICTS = [...new Set(indiaStatesDistricts.flatMap(({ districts }) => districts))].sort((a, b) => a.localeCompare(b));

function StaffList() {
    const [staff, setStaff] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [printError, setPrintError] = useState("");
    const [printing, setPrinting] = useState(false);
    const [reload, setReload] = useState(0);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [stateSearch, setStateSearch] = useState("");
    const [districtSearch, setDistrictSearch] = useState("");

    const selectedState = indiaStatesDistricts.find(({ state }) => state.toLowerCase() === stateSearch.trim().toLowerCase());
    const districtOptions = selectedState?.districts || STAFF_DISTRICTS;

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        getAdminStaff()
            .then((data) => {
                if (!Array.isArray(data?.staff)) throw new Error("The staff response has an unexpected format.");
                if (active) {
                    setStaff([...data.staff].sort((first, second) => {
                        const firstCreated = Date.parse(first.created_at || "");
                        const secondCreated = Date.parse(second.created_at || "");
                        if (!Number.isFinite(firstCreated)) return Number.isFinite(secondCreated) ? 1 : 0;
                        if (!Number.isFinite(secondCreated)) return -1;
                        return secondCreated - firstCreated;
                    }));
                    setTotal(Number(data.total) || data.staff.length);
                }
            })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reload]);

    const updateMember = (updated) => setStaff((current) => current.map((member) => member.id === updated.id ? updated : member));

    const printStaff = async () => {
        setPrintError("");
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            setPrintError("Allow pop-ups for this site to open the staff print report.");
            return;
        }

        setPrinting(true);
        try {
            const html = await getAdminStaffPrint();
            if (typeof html !== "string" || !/<html[\s>]/i.test(html)) {
                throw new Error("The staff print endpoint returned an invalid HTML report.");
            }
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
        } catch (requestError) {
            printWindow.close();
            setPrintError(requestError.message);
        } finally {
            setPrinting(false);
        }
    };

    const activeCount = staff.filter((m) => isActive(m.status)).length;
    const clearFilters = () => {
        setSearch("");
        setFilter("all");
        setStateSearch("");
        setDistrictSearch("");
    };
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const stateQuery = stateSearch.trim().toLowerCase();
        const districtQuery = districtSearch.trim().toLowerCase();
        return staff.filter((m) =>
            (filter === "all" || (filter === "active") === isActive(m.status))
            && (!q || [m.name, m.staff_id, m.email, m.phone, m.state, m.district].some((v) => String(v || "").toLowerCase().includes(q)))
            && (!stateQuery || String(m.state || "").toLowerCase().includes(stateQuery))
            && (!districtQuery || String(m.district || "").toLowerCase().includes(districtQuery)));
    }, [staff, search, filter, stateSearch, districtSearch]);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <style>{CSS}</style>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Staff management</h2>
                    <p className="mt-1 text-[var(--ad-muted)]">Review staff accounts and manage access to the field portal.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={printStaff} disabled={printing} className="as-btn">
                        {printing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                        {printing ? "Preparing report…" : "Print staff"}
                    </button>
                    <button type="button" onClick={() => setReload((value) => value + 1)} disabled={loading} className="as-btn">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            <div className={STRIP}>
                <Stat label="Total staff accounts" value={total} icon={Users} loading={loading} delay={0} tone={{ bg: "#F3E4E8", fg: "#862A42" }} />
                <Stat label="Active" value={activeCount} icon={UserCheck} loading={loading} delay={70} tone={{ bg: "#E3F4EA", fg: "#23865A" }} />
                <Stat label="Inactive" value={staff.length - activeCount} icon={UserX} loading={loading} delay={140} tone={{ bg: "#EEF0F2", fg: "#6B7280" }} />
            </div>

            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage>{printError}</ErrorMessage>

            {loading ? <p className="py-10 text-center text-sm text-[var(--ad-muted)]">Loading staff accounts…</p> : staff.length ? (
                <Panel className="overflow-hidden !p-0" delay={200}>
                    <div className="space-y-4 border-b border-[var(--ad-line)] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <label className="relative block w-full sm:w-80">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-muted)]" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, email or phone…" className="as-input" aria-label="Search staff" />
                            </label>
                            <div className="inline-flex rounded bg-[var(--ad-bg)] p-1" role="tablist" aria-label="Filter by staff status">
                                {FILTERS.map(([id, label]) => (
                                    <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                                        className={`rounded px-4 py-1.5 text-sm font-semibold transition ${filter === id ? "bg-[#5A1A2B] text-white shadow-md" : "text-[var(--ad-muted)] hover:text-[var(--ad-text)]"}`}>{label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="block w-full text-xs font-semibold text-[var(--ad-muted)] sm:w-56">
                                State
                                <input list="staff-state-options" value={stateSearch}
                                    onChange={(event) => {
                                        setStateSearch(event.target.value);
                                        setDistrictSearch("");
                                    }}
                                    placeholder="Type or select a state"
                                    className="ae-input mt-1.5 !h-10" aria-label="Filter staff by state" />
                                <datalist id="staff-state-options">
                                    {STAFF_STATES.map((state) => <option key={state} value={state} />)}
                                </datalist>
                            </label>
                            <label className="block w-full text-xs font-semibold text-[var(--ad-muted)] sm:w-56">
                                District
                                <input list="staff-district-options" value={districtSearch} onChange={(event) => setDistrictSearch(event.target.value)}
                                    placeholder={stateSearch ? "Type or select a district" : "Type or select a district"}
                                    className="ae-input mt-1.5 !h-10" aria-label="Filter staff by district" />
                                <datalist id="staff-district-options">
                                    {districtOptions.map((district) => <option key={district} value={district} />)}
                                </datalist>
                            </label>
                            {(search || filter !== "all" || stateSearch || districtSearch) && (
                                <button type="button" onClick={clearFilters} className="as-btn !h-10 !px-3 !text-xs">Clear filters</button>
                            )}
                        </div>
                    </div>
                    {visible.length ? (
                        <div className="overflow-x-auto">
                            <table className="as-table w-full min-w-[900px] text-left text-sm">
                                <thead><tr><th>Staff member</th><th>Staff ID</th><th>Contact</th><th>Businesses</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                                <tbody>
                                    {visible.map((member) => (
                                        <tr key={member.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <span className="as-avatar">{initials(member.name)}</span>
                                                    <div className="min-w-0">
                                                        <Link to={`/admin/staff/${member.id}`} className="font-semibold hover:text-[var(--ad-gold)]">{display(member.name)}</Link>
                                                        <p className="mt-0.5 text-xs text-[var(--ad-muted)]">{display(member.role)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="as-chip">{display(member.staff_id)}</span></td>
                                            <td>
                                                <p className="flex items-center gap-1.5"><Mail size={13} className="text-[var(--ad-muted)]" />{display(member.email)}</p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ad-muted)]"><Phone size={12} />{display(member.phone)}</p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ad-muted)]"><Phone size={12} />Guardian: {display(member.guardian_contact_number)}</p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ad-muted)]"><MapPin size={12} />{[member.district, member.state].filter(Boolean).join(", ") || "Location not provided"}</p>
                                            </td>
                                            <td>
                                                <span className="inline-flex min-w-9 items-center justify-center rounded bg-[var(--ad-bg)] px-2.5 py-1 font-bold">
                                                    {Array.isArray(member.businesses) ? member.businesses.length.toLocaleString("en-IN") : "—"}
                                                </span>
                                            </td>
                                            <td><StatusBadge status={member.status} /></td>
                                            <td>
                                                <div className="flex items-start justify-end gap-2">
                                                    <Link to={`/admin/staff/${member.id}`} className="as-btn !h-9 !px-3 !text-xs"><Eye size={14} /> View</Link>
                                                    <Link aria-label={`Edit ${member.name}`} to={`/admin/staff/${member.id}/edit`} className="as-btn !h-9 !w-9 !px-0"><Pencil size={14} /></Link>
                                                    <StatusToggle member={member} onUpdated={updateMember} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="py-10 text-center text-sm text-[var(--ad-muted)]">No staff match these filters.</p>}
                    <p className="border-t border-[var(--ad-line)] px-5 py-3 text-xs text-[var(--ad-muted)]">Showing {visible.length} of {staff.length} staff</p>
                </Panel>
            ) : !error ? (
                <Panel className="py-14 text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded bg-[var(--ad-bg)]"><Users size={26} className="text-[var(--ad-gold)]" /></span>
                    <p className="mt-4 font-semibold">No staff accounts found</p>
                </Panel>
            ) : null}
        </div>
    );
}

function DetailRow({ icon, label, value }) {
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

function StaffDetails() {
    const { staffId } = useParams();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        getAdminStaffMember(staffId)
            .then((data) => { if (active) setMember(data); })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [staffId]);

    const count = Array.isArray(member?.businesses) ? member.businesses.length : 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <style>{CSS}</style>
            <Link to="/admin/staff" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ad-muted)] hover:text-[var(--ad-text)]"><ArrowLeft size={16} /> Back to staff</Link>
            <ErrorMessage>{error}</ErrorMessage>
            {loading ? <p className="py-10 text-center text-sm text-[var(--ad-muted)]">Loading staff details…</p> : member ? (
                <>
                    <Panel className="as-hero overflow-hidden">
                        <div className="relative flex flex-wrap items-center justify-between gap-6">
                            <div className="flex min-w-0 items-center gap-5">
                                <span className="as-avatar !size-16 !text-xl">{initials(member.name)}</span>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="truncate text-2xl font-bold">{display(member.name)}</h2>
                                        <StatusBadge status={member.status} />
                                    </div>
                                    <p className="mt-1 text-sm text-[var(--ad-muted)]">{display(member.role)} <span className="mx-1">•</span> <span className="as-chip">{display(member.staff_id)}</span></p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {member.email && <span className="as-pill"><Mail size={13} />{member.email}</span>}
                                        {member.phone && <span className="as-pill"><Phone size={13} />{member.phone}</span>}
                                    </div>
                                </div>
                            </div>
                            <StatusToggle member={member} onUpdated={setMember} />
                        </div>
                    </Panel>

                    <div className={STRIP}>
                        <Stat label="Businesses recorded" value={count} icon={Building2} delay={60} tone={{ bg: "#FAF1D9", fg: "#B08225" }} />
                        <div className="flex items-center gap-4 p-5">
                            <span className="grid size-12 shrink-0 place-items-center rounded bg-[#F3E4E8] text-[#862A42]"><CalendarDays size={22} /></span>
                            <div><p className="text-sm font-medium text-[var(--ad-muted)]">Joined</p><p className="text-base font-bold">{formatDate(member.created_at)}</p></div>
                        </div>
                        <div className="flex items-center gap-4 p-5">
                            <span className="grid size-12 shrink-0 place-items-center rounded bg-[#E3F4EA] text-[#23865A]"><ShieldCheck size={22} /></span>
                            <div><p className="text-sm font-medium text-[var(--ad-muted)]">Access</p><p className="text-base font-bold">{isActive(member.status) ? "Portal enabled" : "Portal disabled"}</p></div>
                        </div>
                    </div>

                    <Panel delay={240}>
                        <h3 className="text-xl font-bold">Account details</h3>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <DetailRow icon={Mail} label="Email" value={member.email} />
                            <DetailRow icon={Phone} label="Phone" value={member.phone} />
                            <DetailRow icon={Phone} label="Guardian contact number" value={member.guardian_contact_number} />
                            <DetailRow icon={MapPin} label="Address" value={member.address} />
                            <DetailRow icon={MapPin} label="State" value={member.state} />
                            <DetailRow icon={MapPin} label="District" value={member.district} />
                            <DetailRow icon={ShieldCheck} label="Aadhaar number" value={member.aadhaar_number} />
                            <DetailRow icon={ShieldCheck} label="Role and status" value={`${display(member.role)} · ${display(member.status)}`} />
                        </div>
                    </Panel>

                    <Panel delay={270}>
                        <h3 className="text-xl font-bold">Aadhaar documents</h3>
                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            {[
                                ["Aadhaar front", member.aadhaar_front_image],
                                ["Aadhaar back", member.aadhaar_back_image],
                            ].map(([label, imageUrl]) => (
                                <div key={label} className="rounded border border-[var(--ad-line)] p-4">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ad-muted)]">{label}</p>
                                    {imageUrl ? (
                                        <a href={imageUrl} target="_blank" rel="noreferrer" className="block">
                                            <img src={imageUrl} alt={label} className="max-h-64 w-full rounded object-contain" />
                                            <span className="mt-2 inline-block text-sm font-semibold text-[var(--ad-gold)]">Open image</span>
                                        </a>
                                    ) : <p className="text-sm text-[var(--ad-muted)]">Not provided</p>}
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel className="overflow-hidden !p-0" delay={300}>
                        <div className="flex items-center gap-3 border-b border-[var(--ad-line)] p-6">
                            <span className="grid size-10 place-items-center rounded bg-[var(--ad-bg)] text-[var(--ad-gold)]"><Building2 size={20} /></span>
                            <div>
                                <h3 className="text-xl font-bold">Recorded businesses</h3>
                                <p className="text-sm text-[var(--ad-muted)]">{count} associated businesses</p>
                            </div>
                        </div>
                        {count ? (
                            <div className="overflow-x-auto">
                                <table className="as-table w-full min-w-[620px] text-left text-sm">
                                    <thead><tr><th>Business</th><th>Category</th><th>Location</th></tr></thead>
                                    <tbody>
                                        {member.businesses.map((business, index) => (
                                            <tr key={business.id ?? index}>
                                                <td className="font-semibold">{display(business.business_name)}</td>
                                                <td><span className="as-chip">{display(business.business_category)}</span></td>
                                                <td className="text-[var(--ad-muted)]">{[business.city, business.district, business.state].filter(Boolean).join(", ") || "Not provided"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="p-6 text-sm text-[var(--ad-muted)]">No businesses have been recorded by this staff member.</p>}
                    </Panel>
                </>
            ) : null}
        </div>
    );
}

const EMPTY_STAFF_PROFILE = {
    name: "",
    email: "",
    phone: "",
    guardian_contact_number: "",
    address: "",
    password: "",
    confirmPassword: "",
    aadhaar_number: "",
    state: "",
    district: "",
    aadhaar_front_image: null,
    aadhaar_back_image: null,
};

function AdminStaffEditForm() {
    const { staffId } = useParams();
    const navigate = useNavigate();
    const [values, setValues] = useState(EMPTY_STAFF_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [existingImages, setExistingImages] = useState({ front: "", back: "" });
    const districts = indiaStatesDistricts.find(({ state }) => state === values.state)?.districts || [];

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError("");
        getAdminStaffMember(staffId)
            .then((member) => {
                if (active) {
                    setValues({
                        ...EMPTY_STAFF_PROFILE,
                        name: member.name || "",
                        email: member.email || "",
                        phone: member.phone || "",
                        guardian_contact_number: member.guardian_contact_number || "",
                        address: member.address || "",
                        aadhaar_number: member.aadhaar_number || "",
                        state: member.state || "",
                        district: member.district || "",
                    });
                    setExistingImages({
                        front: member.aadhaar_front_image || "",
                        back: member.aadhaar_back_image || "",
                    });
                }
            })
            .catch((requestError) => { if (active) setLoadError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [staffId]);

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
    };

    const updateFile = (event) => {
        const { name, files } = event.target;
        setValues((current) => ({ ...current, [name]: files?.[0] || null }));
        setError("");
    };

    const removeFile = (name) => {
        setValues((current) => ({ ...current, [name]: null }));
        setError("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        if (values.password && values.password.length < 8) {
            setError("The new password must be at least 8 characters.");
            return;
        }
        if (values.password !== values.confirmPassword) {
            setError("The new password and confirmation do not match.");
            return;
        }
        if (values.aadhaar_number && !/^\d{12}$/.test(values.aadhaar_number)) {
            setError("Aadhaar number must contain exactly 12 digits.");
            return;
        }

        setSaving(true);
        try {
            const profile = {
                name: values.name.trim(),
                email: values.email.trim(),
                phone: values.phone.trim(),
                guardian_contact_number: values.guardian_contact_number.trim(),
                address: values.address.trim(),
                aadhaar_number: values.aadhaar_number.trim(),
                state: values.state,
                district: values.district,
                aadhaar_front_image: values.aadhaar_front_image,
                aadhaar_back_image: values.aadhaar_back_image,
            };
            if (values.password) profile.password = values.password;
            const updated = await updateAdminStaffProfile(staffId, profile);
            navigate(`/admin/staff/${updated?.id ?? staffId}`, { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <style>{CSS}</style>
            <Link to={`/admin/staff/${staffId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ad-muted)] hover:text-[var(--ad-text)]">
                <ArrowLeft size={16} /> Back to staff details
            </Link>
            <div>
                <h2 className="text-3xl font-bold">Edit staff profile</h2>
                <p className="mt-1 text-[var(--ad-muted)]">Update the staff member’s contact details or set a new password.</p>
            </div>
            <ErrorMessage>{loadError}</ErrorMessage>
            {loading ? <p className="py-10 text-center text-sm text-[var(--ad-muted)]">Loading staff profile…</p> : !loadError ? (
                <Panel className="overflow-hidden !p-0">
                    <h3 className="border-b border-[var(--ad-line)] px-6 py-4 text-lg font-bold">Profile information</h3>
                    <form onSubmit={submit} className="space-y-5 p-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block text-sm font-semibold">
                                Name <span className="text-rose-600">*</span>
                                <input name="name" required value={values.name} onChange={updateField} autoComplete="name" className="ae-input mt-1.5" />
                            </label>
                            <label className="block text-sm font-semibold">
                                Email <span className="text-rose-600">*</span>
                                <input name="email" type="email" required value={values.email} onChange={updateField} autoComplete="email" className="ae-input mt-1.5" />
                            </label>
                            <label className="block text-sm font-semibold">
                                Phone <span className="text-rose-600">*</span>
                                <input name="phone" type="tel" required value={values.phone} onChange={updateField} autoComplete="tel" className="ae-input mt-1.5" />
                            </label>
                            <label className="block text-sm font-semibold">
                                Guardian contact number
                                <input name="guardian_contact_number" type="tel" value={values.guardian_contact_number}
                                    onChange={updateField} autoComplete="tel" className="ae-input mt-1.5" />
                            </label>
                            <label className="block text-sm font-semibold">
                                Aadhaar number
                                <input name="aadhaar_number" type="text" inputMode="numeric" pattern="[0-9]{12}" maxLength={12}
                                    value={values.aadhaar_number} onChange={updateField} className="ae-input mt-1.5" />
                                <span className="mt-1 block text-xs font-normal text-[var(--ad-muted)]">Leave blank or enter exactly 12 digits.</span>
                            </label>
                            <label className="block text-sm font-semibold">
                                State
                                <select name="state" value={values.state} onChange={updateField} className="ae-input mt-1.5">
                                    <option value="">Select state</option>
                                    {indiaStatesDistricts.map(({ state }) => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm font-semibold">
                                District
                                <select name="district" value={values.district} onChange={updateField} disabled={!values.state}
                                    className="ae-input mt-1.5 disabled:cursor-not-allowed disabled:bg-gray-100">
                                    <option value="">Select district</option>
                                    {districts.map((district) => <option key={district} value={district}>{district}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm font-semibold sm:col-span-2">
                                Address <span className="text-rose-600">*</span>
                                <textarea name="address" required rows={4} value={values.address} onChange={updateField} autoComplete="street-address" className="ae-input mt-1.5 !h-auto py-3" />
                            </label>
                        </div>
                        <div className="border-t border-[var(--ad-line)] pt-5">
                            <h4 className="font-bold">Aadhaar documents</h4>
                            <p className="mt-1 text-sm text-[var(--ad-muted)]">Existing images will be kept unless you choose a replacement.</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <AadhaarImageUpload name="aadhaar_front_image" title="Front side"
                                    file={values.aadhaar_front_image} imageUrl={existingImages.front}
                                    onChange={updateFile} onRemove={removeFile} />
                                <AadhaarImageUpload name="aadhaar_back_image" title="Back side"
                                    file={values.aadhaar_back_image} imageUrl={existingImages.back}
                                    onChange={updateFile} onRemove={removeFile} />
                            </div>
                        </div>
                        <div className="border-t border-[var(--ad-line)] pt-5">
                            <h4 className="font-bold">Change password</h4>
                            <p className="mt-1 text-sm text-[var(--ad-muted)]">Leave both fields blank to keep the current password.</p>
                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                <label className="block text-sm font-semibold">
                                    New password
                                    <input name="password" type="password" autoComplete="new-password" minLength={8} value={values.password} onChange={updateField} className="ae-input mt-1.5" />
                                </label>
                                <label className="block text-sm font-semibold">
                                    Confirm new password
                                    <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} value={values.confirmPassword} onChange={updateField} className="ae-input mt-1.5" />
                                </label>
                            </div>
                        </div>
                        <ErrorMessage>{error}</ErrorMessage>
                        <button type="submit" disabled={saving || loading} className="as-btn !h-11 !border-[#5A1A2B] !bg-[#5A1A2B] !px-6 !text-white hover:!bg-[#6B2034]">
                            {saving && <Loader2 size={17} className="animate-spin" />}
                            {saving ? "Saving changes…" : "Save changes"}
                        </button>
                    </form>
                </Panel>
            ) : null}
        </div>
    );
}

export default function AdminStaff() {
    const { staffId } = useParams();
    return staffId ? <StaffDetails /> : <StaffList />;
}

export function AdminStaffEdit() {
    return <AdminStaffEditForm />;
}

const CSS = `
.as-panel{background:var(--ad-card); border:1px solid var(--ad-line); border-radius:6px; padding:24px; box-shadow:0 1px 2px rgba(42,26,31,.06); animation:as-rise .4s ease-out both}
.as-hero{border-top:3px solid #862A42}
.as-btn{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:6px; background:#fff; border:1px solid #D8D0BC; font-size:14px; font-weight:600; transition:border-color .15s,background .15s}
.as-btn:hover:not(:disabled){border-color:#862A42; background:#FBF8F6}
.as-btn:disabled{opacity:.6}
.as-input{width:100%; height:40px; padding:0 12px 0 38px; border-radius:6px; border:1px solid #D8D0BC; background:#fff; font-size:14px; transition:border-color .15s,box-shadow .15s}
.as-input:focus{outline:none; border-color:#862A42; box-shadow:0 0 0 3px rgba(134,42,66,.12)}
.ae-input{width:100%; height:40px; padding:0 12px; border-radius:6px; border:1px solid #D8D0BC; background:#fff; font-size:14px; font-weight:400; transition:border-color .15s,box-shadow .15s}
.ae-input:focus{outline:none; border-color:#862A42; box-shadow:0 0 0 3px rgba(134,42,66,.12)}
.as-table th{padding:12px 20px; font-size:11.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--ad-muted); background:#FAF8F5; border-bottom:1px solid var(--ad-line); white-space:nowrap}
.as-table td{padding:14px 20px; border-bottom:1px solid var(--ad-line); vertical-align:middle}
.as-table tbody tr:last-child td{border-bottom:0}
.as-table tbody tr:hover{background:#FAF8F5}
.as-avatar{display:grid; place-items:center; width:40px; height:40px; flex:none; border-radius:6px; font-weight:700; color:#fff; background:linear-gradient(135deg,#862A42,#5A1A2B)}
.as-chip{display:inline-block; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:600; color:#5A1A2B; background:#F3E4E8; border:1px solid #E6C3CC}
.as-pill{display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:500; background:#FAF8F5; border:1px solid var(--ad-line)}
.as-live{animation:as-ping 2s infinite}
@keyframes as-rise{from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none}}
@keyframes as-ping{0%{box-shadow:0 0 0 0 rgba(5,150,105,.5)} 70%,100%{box-shadow:0 0 0 6px transparent}}
@media(prefers-reduced-motion:reduce){.as-panel,.as-live{animation:none}}
`;