import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, ChevronDown, Eye, Loader2, MapPin, X } from "lucide-react";
import INDIA_STATES_DISTRICTS from "../data/indiaStatesDistricts.json";
import { getCustomerBusinesses } from "../api/customerBusinesses";
import BusinessDetailsModal from "../pages/Businessdetailsmodal";

const STATES = INDIA_STATES_DISTRICTS.map(({ state }) => state).sort((a, b) => a.localeCompare(b));
const DEFAULT_STATE = STATES.find((state) => state === "Kerala") || STATES[0] || "";
const districtsFor = (state) => INDIA_STATES_DISTRICTS.find((item) => item.state.toLowerCase() === state.trim().toLowerCase())?.districts || [];
const EMPTY_FILTERS = { state: DEFAULT_STATE, district: "", location: "", search: "" };
const safeExternalUrl = (value) => {
    if (typeof value !== "string") return "";
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
};

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

function PlaceCityInput({ value, options, onChange }) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const matchingPlaces = useMemo(() => {
        const search = query.trim().toLocaleLowerCase("en-IN");
        return search ? options.filter((place) => place.toLocaleLowerCase("en-IN").includes(search)) : options;
    }, [options, query]);

    useEffect(() => setQuery(value), [value]);

    const showPlaces = () => {
        if (!open) setQuery("");
        setOpen(true);
    };

    const choose = (place) => {
        setQuery(place);
        setOpen(false);
        onChange(place);
    };

    return (
        <div className="relative">
            <label htmlFor="customer-location" className="block text-sm font-medium">
                Place / city
                <div className="relative mt-1.5">
                    <input id="customer-location" role="combobox" aria-autocomplete="list" aria-expanded={open}
                        aria-controls="customer-location-options" autoComplete="off" value={query}
                        onFocus={showPlaces} onClick={showPlaces}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            onChange(event.target.value);
                            setOpen(true);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setQuery(value);
                                setOpen(false);
                            }
                            if (event.key === "Enter" && open) {
                                event.preventDefault();
                                if (matchingPlaces.length === 1) choose(matchingPlaces[0]);
                            }
                        }}
                        onBlur={() => window.setTimeout(() => {
                            setQuery(value);
                            setOpen(false);
                        }, 120)}
                        placeholder="Type or select a place"
                        className="h-12 w-full border border-[var(--afx-line)] bg-[var(--afx-bg)] px-4 pr-10 text-sm placeholder:text-[var(--afx-muted)] focus:border-[var(--afx-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--afx-gold)]/25" />
                    <button type="button" aria-label="Show places in selected district"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            if (open) setOpen(false);
                            else showPlaces();
                        }}
                        className="absolute right-0 top-0 grid h-12 w-10 place-items-center text-[var(--afx-muted)]">
                        <ChevronDown size={17} aria-hidden="true" />
                    </button>
                </div>
            </label>
            {open && (
                <ul id="customer-location-options" role="listbox"
                    className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--afx-line)] bg-[var(--afx-bg)] py-1 shadow-xl">
                    {matchingPlaces.map((place) => (
                        <li key={place} role="option" aria-selected={place === value}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => choose(place)}
                            className={`cursor-pointer px-4 py-2.5 text-sm hover:bg-[var(--afx-surface)] ${place === value ? "font-semibold text-[var(--afx-gold-deep)]" : ""}`}>
                            {place}
                        </li>
                    ))}
                    {!matchingPlaces.length && (
                        <li className="px-4 py-2.5 text-sm text-[var(--afx-muted)]">
                            {options.length ? "No saved places match. Keep typing to search for this place." : "No saved places in this district yet. Type a place to search."}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}

function DistrictPicker({ value, options, disabled, onSelect }) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const matchingDistricts = useMemo(() => {
        const search = query.trim().toLocaleLowerCase("en-IN");
        return search ? options.filter((district) => district.toLocaleLowerCase("en-IN").includes(search)) : options;
    }, [options, query]);

    useEffect(() => setQuery(value), [value]);

    const choose = (district) => {
        setQuery(district);
        setOpen(false);
        onSelect(district);
    };

    const showDistricts = () => {
        if (!open) setQuery("");
        setOpen(true);
    };

    return (
        <div className="relative">
            <label htmlFor="customer-district" className="block text-sm font-medium">
                District
                <div className="relative mt-1.5">
                    <input id="customer-district" role="combobox" aria-autocomplete="list" aria-expanded={open}
                        aria-controls="customer-district-options" value={query}
                        onFocus={showDistricts} onClick={showDistricts}
                        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setQuery(value);
                                setOpen(false);
                            }
                            if (event.key === "Enter" && open) {
                                event.preventDefault();
                                if (matchingDistricts.length === 1) choose(matchingDistricts[0]);
                            }
                        }}
                        onBlur={() => window.setTimeout(() => {
                            setQuery(value);
                            setOpen(false);
                        }, 120)}
                        disabled={disabled} placeholder={disabled ? "Select a state first" : "Type or select a district"}
                        autoComplete="off"
                        className="mt-0 h-12 w-full border border-[var(--afx-line)] bg-[var(--afx-surface)] px-4 pr-10 text-sm focus:border-[var(--afx-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--afx-gold)]/25 disabled:cursor-not-allowed disabled:opacity-60" />
                    <ChevronDown size={17} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--afx-muted)]" />
                </div>
            </label>
            {open && !disabled && (
                <ul id="customer-district-options" role="listbox"
                    className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--afx-line)] bg-[var(--afx-bg)] py-1 shadow-xl">
                    <li role="option" aria-selected={!value}
                        onMouseDown={(event) => event.preventDefault()} onClick={() => choose("")}
                        className="cursor-pointer px-4 py-2.5 text-sm text-[var(--afx-muted)] hover:bg-[var(--afx-surface)]">
                        All districts
                    </li>
                    {matchingDistricts.length ? matchingDistricts.map((district) => (
                        <li key={district} role="option" aria-selected={district === value}
                            onMouseDown={(event) => event.preventDefault()} onClick={() => choose(district)}
                            className={`cursor-pointer px-4 py-2.5 text-sm hover:bg-[var(--afx-surface)] ${district === value ? "font-semibold text-[var(--afx-gold-deep)]" : ""}`}>
                            {district}
                        </li>
                    )) : (
                        <li className="px-4 py-2.5 text-sm text-[var(--afx-muted)]">No districts match “{query}”.</li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default function CustomerBusinessExplorer() {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [businesses, setBusinesses] = useState([]);
    const [knownPlaces, setKnownPlaces] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            setLoading(true);
            setError("");
            getCustomerBusinesses(filters)
                .then((data) => {
                    if (!Array.isArray(data?.businesses)) {
                        throw new Error("The public business directory returned an unexpected response.");
                    }
                    if (active) {
                        setBusinesses(data.businesses);
                        setKnownPlaces((current) => {
                            const discovered = data.businesses
                                .filter((business) => typeof business.city === "string" && business.city.trim())
                                .map((business) => ({
                                    city: business.city.trim(),
                                    state: (business.state || filters.state).trim(),
                                    district: (business.district || filters.district).trim(),
                                }));
                            const known = new Map(current.map((place) => [
                                `${place.state.toLocaleLowerCase("en-IN")}|${place.district.toLocaleLowerCase("en-IN")}|${place.city.toLocaleLowerCase("en-IN")}`,
                                place,
                            ]));
                            discovered.forEach((place) => known.set(
                                `${place.state.toLocaleLowerCase("en-IN")}|${place.district.toLocaleLowerCase("en-IN")}|${place.city.toLocaleLowerCase("en-IN")}`,
                                place
                            ));
                            return [...known.values()];
                        });
                        setTotal(Number(data.total) || data.businesses.length);
                    }
                })
                .catch((requestError) => { if (active) setError(requestError.message); })
                .finally(() => { if (active) setLoading(false); });
        }, filters.location || filters.search ? 300 : 0);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [filters]);

    const districts = useMemo(() => districtsFor(filters.state), [filters.state]);
    const places = useMemo(() => [...new Set(knownPlaces
        .filter((place) => (!filters.state || place.state.toLocaleLowerCase("en-IN") === filters.state.toLocaleLowerCase("en-IN"))
            && (!filters.district || place.district.toLocaleLowerCase("en-IN") === filters.district.toLocaleLowerCase("en-IN")))
        .map((place) => place.city))]
        .sort((a, b) => a.localeCompare(b)), [filters.district, filters.state, knownPlaces]);
    const change = (key) => (event) => setFilters((current) => ({
        ...current,
        [key]: event.target.value,
        ...(key === "state" ? { district: "", location: "" } : {}),
        ...(key === "district" ? { location: "" } : {}),
    }));
    const changeLocation = useCallback((location) => {
        setFilters((current) => ({ ...current, location }));
    }, []);
    const clear = () => {
        setFilters(EMPTY_FILTERS);
    };
    const closeDetails = useCallback(() => setSelectedBusiness(null), []);

    return (
        <div className="mt-10">
            <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
                <label htmlFor="customer-state" className="block text-sm font-medium">
                    State
                    <select id="customer-state" value={filters.state} onChange={change("state")} className="mt-1.5 h-12 w-full border border-[var(--afx-line)] bg-[var(--afx-surface)] px-4 text-sm focus:border-[var(--afx-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--afx-gold)]/25">
                        <option value="">All states</option>
                        {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                </label>
                <DistrictPicker value={filters.district} options={districts} disabled={!filters.state}
                    onSelect={(district) => setFilters((current) => ({ ...current, district, location: "" }))} />
                <PlaceCityInput value={filters.location} options={places} onChange={changeLocation} />
                <FilterInput id="customer-search" label="Business / category" value={filters.search}
                    placeholder="Name, category or keyword" onChange={change("search")} />
                <div className="flex gap-2">
                    <button type="button" onClick={clear} className="afx-btn-line inline-flex h-12 items-center gap-2 px-4" aria-label="Reset filters"><X size={17} /></button>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--afx-line)] pb-4">
                <div className="flex items-center gap-2 text-sm text-[var(--afx-muted)]">
                    <MapPin size={16} className="text-[var(--afx-gold)]" />
                    {filters.district ? `${filters.district}, ${filters.state}` : filters.state || "All locations"}
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
                    {businesses.map((business) => {
                        const locationLink = safeExternalUrl(business.location_link);
                        return (
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
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button type="button" onClick={() => setSelectedBusiness(business)}
                                            className="afx-btn-gold inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm hover:shadow-md">
                                            <Eye size={16} /> View details
                                        </button>
                                        {locationLink && (
                                            <a href={locationLink} target="_blank" rel="noreferrer"
                                                aria-label={`Open map for ${business.business_name || "business"}`}
                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--afx-gold)] bg-[var(--afx-gold-soft)] px-4 text-sm font-semibold text-[var(--afx-gold-deep)] transition-colors hover:bg-[var(--afx-gold)] hover:text-white">
                                                <MapPin size={16} /> View map
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
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
