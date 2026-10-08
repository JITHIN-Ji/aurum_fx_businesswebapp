import { createElement, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Building2, CalendarDays, Mail, MapPin, Phone, UserRound, X } from "lucide-react";

const show = (value) => (value === null || value === undefined || value === "" ? null : String(value));

function Row({ icon, label, value, href }) {
    const text = show(value);
    if (!text) return null;
    const Tag = href ? "a" : "div";
    return (
        <Tag href={href} className={`afx-row ${href ? "afx-row-link" : ""}`}>
            <span className="afx-row-icon">{createElement(icon, { size: 17 })}</span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--afx-muted)]">{label}</p>
                <p className={`mt-0.5 break-words text-sm font-medium ${href ? "text-[var(--afx-gold-deep)]" : ""}`}>{text}</p>
            </div>
        </Tag>
    );
}

/* Usage: {selected && <BusinessDetailsModal business={selected} onClose={() => setSelected(null)} />} */
export default function BusinessDetailsModal({ business, onClose }) {
    const closeRef = useRef(null);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.dispatchEvent(new Event("afx:modal-open"));
        closeRef.current?.focus();
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.dispatchEvent(new Event("afx:modal-close"));
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    if (!business) return null;
    const b = business;
    const location = [b.city, b.district, b.state].filter(Boolean).join(", ");
    const phone = show(b.owner_phone);

    return createPortal(
        <div className="afx afx-modal-backdrop fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <style>{CSS}</style>
            <div role="dialog" aria-modal="true" aria-labelledby="afx-modal-title" className="afx-modal flex w-full max-w-2xl min-h-0 flex-col overflow-hidden">

                <div className="afx-grab" aria-hidden="true" />

                <div className="afx-modal-head flex items-start justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-7 sm:py-6">
                    <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                        <span className="afx-avatar grid size-12 shrink-0 place-items-center text-lg font-semibold text-white sm:size-14 sm:text-xl">{(b.business_name || "B")[0].toUpperCase()}</span>
                        <div className="min-w-0">
                            <h2 id="afx-modal-title" className="afx-serif text-xl font-semibold leading-tight sm:text-2xl" style={{ overflowWrap: "anywhere" }}>{b.business_name || "Business details"}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                {b.business_category && <span className="afx-tag">{b.business_category}</span>}
                                {b.business_type && <span className="afx-tag">{b.business_type}</span>}
                                {location && <span className="flex items-center gap-1 text-sm text-[var(--afx-muted)]"><MapPin size={14} className="shrink-0" />{location}</span>}
                            </div>
                        </div>
                    </div>
                    <button ref={closeRef} type="button" onClick={onClose} aria-label="Close details" className="afx-close grid size-10 shrink-0 place-items-center"><X size={18} /></button>
                </div>

                <div data-lenis-prevent className="afx-scroll min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain px-5 py-5 sm:space-y-7 sm:px-7 sm:py-6" style={{ WebkitOverflowScrolling: "touch" }}>
                    {b.image && <img src={b.image} alt={b.business_name || "Business"} className="max-h-52 w-full border border-[var(--afx-line)] object-cover sm:max-h-60" style={{ borderRadius: 14 }} />}

                    {show(b.business_description) && (
                        <section>
                            <h3 className="afx-h3">About</h3>
                            <p className="whitespace-pre-line text-sm leading-relaxed sm:text-[15px]">{b.business_description}</p>
                        </section>
                    )}

                    <section>
                        <h3 className="afx-h3">Contact</h3>
                        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                            <Row icon={UserRound} label="Owner" value={b.owner_name} />
                            <Row icon={Phone} label="Phone" value={b.owner_phone} href={phone ? `tel:${phone.replace(/\s/g, "")}` : undefined} />
                            <Row icon={Phone} label="Alternate phone" value={b.alternate_phone} href={show(b.alternate_phone) ? `tel:${String(b.alternate_phone).replace(/\s/g, "")}` : undefined} />
                            <Row icon={Mail} label="Email" value={b.email} href={show(b.email) ? `mailto:${b.email}` : undefined} />
                        </div>
                    </section>

                    <section>
                        <h3 className="afx-h3">Location & business</h3>
                        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                            <Row icon={MapPin} label="Address" value={b.address} />
                            <Row icon={MapPin} label="District / city" value={[b.district, b.city].filter(Boolean).join(" · ")} />
                            <Row icon={MapPin} label="State · PIN code" value={[b.state, b.pincode].filter(Boolean).join(" · ")} />
                            <Row icon={CalendarDays} label="Established" value={b.year_established} />
                            <Row icon={Building2} label="Business type" value={b.business_type} />
                        </div>
                    </section>
                </div>

                <div className="afx-modal-foot grid grid-cols-2 gap-3 px-5 py-4 sm:flex sm:items-center sm:justify-end sm:px-7">
                    <button type="button" onClick={onClose} className="afx-btn-line h-11 px-5 text-sm font-medium" style={{ borderRadius: 10, gridColumn: phone ? undefined : "1 / -1" }}>Close</button>
                    {phone && <a href={`tel:${phone.replace(/\s/g, "")}`} className="afx-btn-gold inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold" style={{ borderRadius: 10 }}><Phone size={15} /> Call owner</a>}
                </div>
            </div>
        </div>,
        document.body
    );
}

const CSS = `
/* shell */
.afx-modal-backdrop{background:rgba(20,17,11,.28);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:afx-m-fade .25s ease-out both}
.afx-modal{position:relative;background:var(--afx-bg);color:var(--afx-text);border:1px solid var(--afx-line);box-shadow:0 30px 80px -20px rgba(20,17,11,.45),0 2px 6px rgba(20,17,11,.08);border-radius:22px 22px 0 0;max-height:92dvh;animation:afx-m-sheet .38s cubic-bezier(.2,.8,.2,1) both}
.afx-modal::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,transparent,var(--afx-gold),transparent);z-index:1}
.afx-grab{display:block;width:42px;height:4px;border-radius:99px;background:var(--afx-line);margin:10px auto 0}
@media(min-width:640px){
  .afx-modal{border-radius:22px;max-height:86dvh;animation:afx-m-up .35s cubic-bezier(.2,.8,.2,1) both}
  .afx-grab{display:none}
}

/* header + footer */
.afx-modal-head{border-bottom:1px solid var(--afx-line);background:linear-gradient(180deg,var(--afx-surface),var(--afx-bg))}
.afx-modal-foot{border-top:1px solid var(--afx-line);background:var(--afx-surface);padding-bottom:max(1rem,env(safe-area-inset-bottom))}
.afx-avatar{border-radius:14px;background:linear-gradient(145deg,var(--afx-gold),var(--afx-gold-deep));box-shadow:0 8px 18px -8px rgba(138,100,32,.6),inset 0 1px 0 rgba(255,255,255,.25)}
.afx-close{border:1px solid var(--afx-line);border-radius:10px;color:var(--afx-muted);background:var(--afx-bg);transition:transform .25s,border-color .2s,color .2s,background .2s}
.afx-close:hover{border-color:var(--afx-gold);color:var(--afx-text);background:var(--afx-surface);transform:rotate(90deg)}
.afx-close:active{transform:rotate(90deg) scale(.92)}

/* content */
.afx-tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;color:var(--afx-gold-deep);background:var(--afx-gold-soft);border:1px solid color-mix(in srgb,var(--afx-gold) 35%,transparent)}
.afx-h3{margin-bottom:10px;font-size:13px;font-weight:600;color:var(--afx-muted)}
.afx-scroll{scrollbar-width:thin;scrollbar-color:var(--afx-line) transparent}
.afx-row{display:flex;gap:14px;align-items:center;padding:12px 14px;background:var(--afx-bg);border:1px solid var(--afx-line);border-radius:12px;transition:border-color .2s,transform .2s,box-shadow .2s,background .2s}
.afx-row-icon{display:grid;place-items:center;width:36px;height:36px;flex-shrink:0;border-radius:10px;background:var(--afx-gold-soft);color:var(--afx-gold-deep);transition:background .2s,color .2s}
.afx-row-link:hover{border-color:var(--afx-gold);transform:translateY(-2px);box-shadow:0 10px 22px -12px rgba(80,60,20,.35)}
.afx-row-link:hover .afx-row-icon{background:var(--afx-gold);color:#fff}
.afx-row-link:active{transform:scale(.99)}

/* buttons (modal is portalled outside the page, so redefined here) */
.afx-btn-gold{background:linear-gradient(180deg,var(--afx-gold),var(--afx-gold-deep));color:#fff;box-shadow:0 6px 16px -6px rgba(138,100,32,.55);transition:transform .2s,box-shadow .2s,filter .2s}
.afx-btn-gold:hover{transform:translateY(-1px);box-shadow:0 10px 22px -8px rgba(138,100,32,.6);filter:brightness(1.05)}
.afx-btn-gold:active{transform:scale(.98)}
.afx-btn-line{border:1px solid var(--afx-line);background:var(--afx-bg);color:var(--afx-text);transition:border-color .2s,background .2s,transform .2s}
.afx-btn-line:hover{border-color:var(--afx-gold);background:var(--afx-surface)}
.afx-btn-line:active{transform:scale(.98)}
.afx-modal :focus-visible{outline:2px solid var(--afx-gold);outline-offset:2px}

@keyframes afx-m-fade{from{opacity:0}}
@keyframes afx-m-up{from{opacity:0;transform:translateY(24px) scale(.97)}}
@keyframes afx-m-sheet{from{transform:translateY(100%)}}
@media(prefers-reduced-motion:reduce){.afx-modal-backdrop,.afx-modal{animation:none}.afx-close:hover{transform:none}}
`;