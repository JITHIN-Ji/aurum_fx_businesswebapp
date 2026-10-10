import { ExternalLink, MapPin } from "lucide-react";

export default function GoogleMapsLinkField({ value, onChange, businessDetails, inputClassName, buttonClassName }) {
    const query = [
        businessDetails.business_name,
        businessDetails.business_type,
        businessDetails.business_category,
        businessDetails.address,
        businessDetails.city,
        businessDetails.district,
        businessDetails.state,
        businessDetails.pincode,
    ].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
    const mapsUrl = query
        ? new URL("https://www.google.com/maps/search/")
        : new URL("https://www.google.com/maps");
    if (query) {
        mapsUrl.searchParams.set("api", "1");
        mapsUrl.searchParams.set("query", query);
    }

    return (
        <div className="sm:col-span-2 min-w-0">
            <label className="block text-sm font-semibold">
                Map / location link <span className="font-normal text-slate-500">(paste the selected place’s link)</span>
                <input type="url" value={value} onChange={(event) => onChange(event.target.value)}
                    className={`${inputClassName} mt-1.5`} placeholder="https://www.google.com/maps/…" />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a href={mapsUrl.toString()} target="_blank" rel="noopener noreferrer" className={buttonClassName}>
                    <MapPin size={15} /> Search in Google Maps <ExternalLink size={13} />
                </a>
            </div>
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                Open Google Maps, search for the business, then share and copy its link. Paste the link here.
            </p>
        </div>
    );
}
