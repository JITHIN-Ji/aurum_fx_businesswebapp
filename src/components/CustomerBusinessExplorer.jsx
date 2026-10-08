import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Eye, Loader2, MapPin, Search, X } from "lucide-react";
import INDIA_STATES_DISTRICTS from "../data/indiaStatesDistricts.json";
import { getCustomerBusinesses } from "../api/customerBusinesses";
import BusinessDetailsModal from "../pages/Businessdetailsmodal";

const STATES = INDIA_STATES_DISTRICTS.map(({ state }) => state).sort((a, b) => a.localeCompare(b));
const DEFAULT_STATE = STATES.find((state) => state === "Kerala") || STATES[0] || "";
const districtsFor = (state) => INDIA_STATES_DISTRICTS.find((item) => item.state.toLowerCase() === state.trim().toLowerCase())?.districts || [];
const DEFAULT_DISTRICT = districtsFor(DEFAULT_STATE).find((district) => district === "Thrissur") || districtsFor(DEFAULT_STATE)[0] || "";
const EMPTY_FILTERS = { state: DEFAULT_STATE, district: DEFAULT_DISTRICT, location: "", search: "" };

function FilterInput({ id, label, value, onChange, options = [], placeholder }) {
    return (
        <label htmlFor={id} className="block text-sm font-medium">
            {label}
            <input id={id} list={`${id}-options`} autoComplete="off" value={value} onChange={onChange}
                placeholder={placeholder} className="mt-1.5 h-12 w-full border border-[var(--afx-line)] bg-[var(--afx-bg)] px-4 text-sm placeholder:text-[var(--afx-muted)] focus:border-[var(--afx-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--afx-gold)]/25" />
            <datalist id={`${id}-options`}>{options.map((option) => <option key={option} value={option} />)}</datalist>
        </label>
    );
}

export default function CustomerBusinessExplorer() {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [applied, setApplied] = useState(EMPTY_FILTERS);
    const [businesses, setBusinesses] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        getCustomerBusinesses(applied)
            .then((data) => {
                if (!Array.isArray(data?.businesses)) {
                    throw new Error("The public business directory returned an unexpected response.");
                }
                if (active) {
                    setBusinesses(data.businesses);
                    setTotal(Number(data.total) || data.businesses.length);
                }
            })
            .catch((requestError) => { if (active) setError(requestError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [applied]);

    const districts = useMemo(() => districtsFor(filters.state), [filters.state]);
    const places = useMemo(() => [...new Set(businesses.map((business) => business.city).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)), [businesses]);
    const change = (key) => (event) => setFilters((current) => ({
        ...current,
        [key]: event.target.value,
        ...(key === "state" ? { district: "", location: "" } : {}),
        ...(key === "district" ? { location: "" } : {}),
    }));
    const search = (event) => {
        event.preventDefault();
        setApplied({ ...filters });
    };
    const clear = () => {
        setFilters(EMPTY_FILTERS);
        setApplied(EMPTY_FILTERS);
    };
    const closeDetails = useCallback(() => setSelectedBusiness(null), []);

    return (
        <div className="mt-10">
            <form onSubmit={search} className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
                <FilterInput id="customer-state" label="State" value={filters.state} options={STATES}
                    placeholder="Type a state, e.g. Kerala" onChange={change("state")} />
                <FilterInput id="customer-district" label="District" value={filters.district} options={districts}
                    placeholder={filters.state ? `Type a district in ${filters.state}` : "Select a state first"} onChange={change("district")} />
                <FilterInput id="customer-location" label="Place / city" value={filters.location} options={places}
                    placeholder="Type a place" onChange={change("location")} />
                <FilterInput id="customer-search" label="Business search" value={filters.search}
                    placeholder="Name, category or keyword" onChange={change("search")} />
                <div className="flex gap-2">
                    <button type="submit" className="afx-btn-gold inline-flex h-12 items-center gap-2 px-5 font-medium"><Search size={17} /> Search</button>
                    <button type="button" onClick={clear} className="afx-btn-line inline-flex h-12 items-center gap-2 px-4" aria-label="Reset filters"><X size={17} /></button>
                </div>
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--afx-line)] pb-4">
                <div className="flex items-center gap-2 text-sm text-[var(--afx-muted)]">
                    <MapPin size={16} className="text-[var(--afx-gold)]" />
                    {applied.district ? `${applied.district}, ${applied.state}` : applied.state || "All locations"}
                </div>
                <p aria-live="polite" className="text-sm text-[var(--afx-muted)]">
                    {loading ? "Loading businesses…" : `${total.toLocaleString("en-IN")} ${total === 1 ? "business" : "businesses"} found`}
                </p>
            </div>

            {error && <p role="alert" className="mt-5 flex items-start gap-2 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
            {loading ? (
                <p className="flex items-center justify-center gap-2 py-14 text-sm text-[var(--afx-muted)]"><Loader2 size={18} className="animate-spin" /> Loading public business listings…</p>
            ) : businesses.length ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {businesses.map((business) => (
                        <article key={business.id} className="overflow-hidden border border-[var(--afx-line)] bg-[var(--afx-bg)]">
                            {business.image ? (
                                <img src={business.image} alt={business.business_name || "Business"} loading="lazy"
                                    onError={(event) => { event.currentTarget.hidden = true; }}
                                    className="h-48 w-full bg-[var(--afx-surface)] object-cover" />
                            ) : (
                                <div className="grid h-48 place-items-center bg-[var(--afx-surface)]"><Building2 size={38} strokeWidth={1.3} className="text-[var(--afx-gold)]" /></div>
                            )}
                            <div className="p-5">
                                <div className="flex flex-wrap gap-2">
                                    {business.business_category && <span className="border border-[var(--afx-line)] px-2.5 py-1 text-xs text-[var(--afx-gold-deep)]">{business.business_category}</span>}
                                    {business.business_type && <span className="border border-[var(--afx-line)] px-2.5 py-1 text-xs text-[var(--afx-muted)]">{business.business_type}</span>}
                                </div>
                                <h3 className="afx-serif mt-3 text-xl font-semibold">{business.business_name}</h3>
                                <p className="mt-1 text-sm text-[var(--afx-muted)]">Owner: {business.owner_name || "Not provided"}</p>
                                <p className="mt-3 flex items-start gap-1.5 text-sm text-[var(--afx-muted)]"><MapPin size={15} className="mt-0.5 shrink-0 text-[var(--afx-gold)]" />{[business.city, business.district, business.state].filter(Boolean).join(", ") || business.address}</p>
                                {business.address && <p className="mt-2 line-clamp-2 text-sm text-[var(--afx-muted)]">{business.address}{business.pincode ? ` · ${business.pincode}` : ""}</p>}
                                {business.business_description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--afx-muted)]">{business.business_description}</p>}
                                <button type="button" onClick={() => setSelectedBusiness(business)}
                                    className="afx-btn-line mt-4 inline-flex h-10 items-center gap-2 px-4 text-sm font-medium">
                                    <Eye size={16} /> View details
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : !error ? (
                <div className="py-14 text-center">
                    <Building2 size={30} className="mx-auto text-[var(--afx-gold)]" />
                    <p className="mt-3 font-medium">No businesses found for this selection.</p>
                    <p className="mt-1 text-sm text-[var(--afx-muted)]">Try another state, district, place or search term.</p>
                </div>
            ) : null}
            {selectedBusiness && <BusinessDetailsModal business={selectedBusiness} onClose={closeDetails} />}
        </div>
    );
}
