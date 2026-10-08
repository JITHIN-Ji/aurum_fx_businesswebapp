"use client"
import { createElement, useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";
import { Link } from "react-router-dom";
import CustomerBusinessExplorer from "../components/CustomerBusinessExplorer";
import {
    ArrowRight, BadgeCheck, BookOpen, Car, ChevronDown, ClipboardList, Footprints,
    Gem, Layers, MapPin, Phone, Pill, Scissors, Shirt, Smartphone, Sofa, Store,
    Utensils, Wheat, Wrench, Globe2, Database, Users, Plus,
} from "lucide-react";
import { useThemeContext } from "../context/ThemeContext";

/* -------------------------------------------------------------------------- */
/*  IMAGES — Unsplash photo IDs (free to use under the Unsplash License)       */
/*  If one ever fails to load, <Img> shows a gold panel instead of a broken    */
/*  image. These are representative photos, not the actual listed shops.       */
/* -------------------------------------------------------------------------- */
const u = (id, w = 1200) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;
const P = {
    street: "photo-1659359506600-064ece5af8a4",
    charminar: "photo-1741545979534-02f59c742730",
    night: "photo-1589820745206-c6b6d3602361",
    bags: "photo-1642434238273-c21f34a77450",
    gold: "photo-1622533277912-19027c3d14e5",
    spices: "photo-1716816211590-c15a328a5ff0",
    shopfront: "photo-1629212191994-76eccd4aeb17",
    wholesale: "photo-1589900586776-53db57559c73",
    vases: "photo-1660747279721-89dd62d9f054",
    decor: "photo-1567763080747-35963b554bbd",
    vendors: "photo-1570135460237-510ca82c6781",
    store: "photo-1717607424466-b4d26351a765",
    vegMarket: "photo-1676475007077-b02be1724106",   // Pune vegetable market
    vegShop: "photo-1677381342494-df65499bb0ca",     // Delhi vegetable & fruit shop
    loom: "photo-1640292343595-889db1c8262e",        // handloom textiles, Telangana
    cafe: "photo-1611902169148-857ebcf717b9",        // cafe interior, Hyderabad
};


const HERO_SLIDES = [
    { id: "photo-1621073831231-faa453d28112", label: "Growing cities" },
    { id: "photo-1578771607806-a34b27022297", label: "Business districts" },
    { id: "photo-1565950916843-3df27b0d0bdc", label: "Financial centres" },
    { id: "photo-1599398766380-23b3144142c7", label: "Corporate towers" },
    { id: "photo-1761937841713-6b43e3f50efa", label: "Modern headquarters" },
    { id: "photo-1773665231158-d80e8a86f44d", label: "Trade hubs" },
    { id: "photo-1768463852068-cc277b8baf35", label: "Waterfront offices" },
    { id: "photo-1691814499176-f5d431058ebf", label: "Global skylines" },
];
const HERO_SMALL = [
    { id: "photo-1691814499176-f5d431058ebf", label: "Skylines" },
    { id: "photo-1599398766380-23b3144142c7", label: "Towers" },
    { id: "photo-1565950916843-3df27b0d0bdc", label: "Finance" },
    { id: "photo-1621073831231-faa453d28112", label: "Cities" },
    { id: "photo-1773665231158-d80e8a86f44d", label: "Business hubs" },
];

const CATEGORIES = [
    { icon: Store, name: "Kirana & grocery" }, { icon: Shirt, name: "Textiles & garments" },
    { icon: Gem, name: "Jewellery" }, { icon: Pill, name: "Pharmacies" },
    { icon: Wrench, name: "Hardware & tools" }, { icon: Utensils, name: "Restaurants" },
    { icon: Smartphone, name: "Electronics" }, { icon: Wheat, name: "Agri supplies" },
    { icon: Car, name: "Auto parts" }, { icon: Scissors, name: "Salons" },
    { icon: Sofa, name: "Furniture" }, { icon: BookOpen, name: "Stationery" },
];

// PLACEHOLDER numbers — replace with real figures before going live.
const STATS = [
    { value: 700, suffix: "+", label: "Districts covered" },
    { value: 5, suffix: " lakh+", label: "Businesses recorded" },
    { value: 40, suffix: "+", label: "Business categories" },
    { value: 1200, suffix: "+", label: "Field staff on the ground" },
];

// About section. TODO: confirm every claim below matches your real business before launch.
const PARTNER_SLIDES = [
    { id: "photo-1578771607806-a34b27022297", label: "Business districts" },
    { id: "photo-1565950916843-3df27b0d0bdc", label: "Financial centres" },
    { id: "photo-1761937841713-6b43e3f50efa", label: "Modern headquarters" },
    { id: "photo-1621073831231-faa453d28112", label: "Growing cities" },
    { id: "photo-1599398766380-23b3144142c7", label: "Corporate towers" },
];

const GROWTH = [
    { phase: "Phase 1", title: "First districts", text: "Field teams began visiting shops and recording them district by district." },
    { phase: "Phase 2", title: "State by state", text: "Coverage widened across states, with more business categories added." },
    { phase: "Phase 3", title: "Partners everywhere", text: "A growing network of business partners in every state and district we cover." },
    { phase: "Next", title: "Field staff dashboard", text: "A dedicated login for field staff to add and update records directly." },
];
const ALL_STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const STEPS = [
    { icon: Footprints, title: "Visit", text: "A field staff member walks the district, market by market, and meets each shop owner." },
    { icon: ClipboardList, title: "Record", text: "Shop name, category, address, contact and photos are entered in the field staff dashboard." },
    { icon: BadgeCheck, title: "Verify", text: "Each entry is checked against the visit, so a listing means someone has actually been there." },
    { icon: Database, title: "Publish", text: "Verified records join the district directory that Aurum FX customers can browse." },
];

const TRUST = [
    { icon: Users, title: "Collected in person", text: "Our own field staff visit every shop. Nothing is scraped or bought in." },
    { icon: Globe2, title: "Every district", text: "Coverage is planned district by district across India, not just the big cities." },
    { icon: Layers, title: "Every kind of business", text: "From a corner kirana to a wholesale jeweller, each gets the same record." },
    { icon: MapPin, title: "One home for the data", text: "Records are kept in a single field staff dashboard, so the directory stays consistent." },
];

// TODO: replace with real customer quotes before launch.
const QUOTES = [
    { text: "We found suppliers in districts we had never worked in, and the details matched when we called.", who: "Procurement lead", org: "Retail distributor" },
    { text: "The listings are specific: category, address, contact. We stopped doing our own cold research.", who: "Regional manager", org: "FMCG company" },
    { text: "Seeing every business in a district in one place saved our team weeks of travel planning.", who: "Operations head", org: "Logistics firm" },
];

const FAQS = [
    { q: "Where does Aurum FX get its business data?", a: "Our field staff collect it in person. They visit shops and businesses in each district and enter the details in our field staff dashboard." },
    { q: "Which districts do you cover?", a: "We are building coverage across India, district by district. Use the directory above to browse current public business listings by state, district and place." },
    { q: "What kinds of businesses are included?", a: "Retail shops, wholesalers, manufacturers, restaurants, service businesses and more. Each record carries a category so you can filter by type." },
    { q: "How do I get access to district data?", a: "Contact our team with the districts and business types you need, and we will walk you through what is available." },
    { q: "How current is the data?", a: "Every record is tied to a field visit. Our team plans repeat visits so listings can be refreshed." },
];

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function Img({ src, alt, className = "", eager = false }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <div role="img" aria-label={alt} className={`afx-fallback ${className}`} />;
    return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

function useInView(threshold = 0.35) {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setSeen(true); io.disconnect(); }
        }, { threshold });
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);
    return [ref, seen];
}

function CountUp({ to, suffix = "" }) {
    const [ref, seen] = useInView();
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!seen) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
        let raf; const t0 = performance.now(), dur = 1400;
        const tick = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [seen, to]);
    return <span ref={ref}>{n.toLocaleString("en-IN")}{suffix}</span>;
}

// Crossfading image slider with a slow zoom on the active slide
function Slider({ slides, interval = 4200, start = 0, className = "", showDots = false }) {
    const [i, setI] = useState(start);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => setI((x) => (x + 1) % slides.length), interval);
        return () => clearInterval(id);
    }, [paused, interval, slides.length]);
    return (
        <div className={`relative overflow-hidden bg-[var(--afx-surface)] ${className}`}
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {slides.map((s, idx) => (
                <div key={s.label} aria-hidden={idx !== i}
                    className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${idx === i ? "opacity-100" : "opacity-0"}`}>
                    <Img src={u(s.id, 1000)} alt={s.label} eager={idx < 2} className={`w-full h-full ${idx === i ? "afx-kb" : ""}`} />
                </div>
            ))}
            <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-between gap-3">
                <span key={i} className="afx-swap text-white text-sm font-medium">{slides[i].label}</span>
                {showDots && (
                    <div className="flex gap-1.5" role="tablist" aria-label="Choose image">
                        {slides.map((s, idx) => (
                            <button key={s.label} role="tab" aria-selected={idx === i} aria-label={s.label} onClick={() => setI(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? "w-6 bg-[var(--afx-gold)]" : "w-1.5 bg-white/60"}`} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------------------------- Directory explorer --------------------------- */

function DirectoryExplorer() {
    return <CustomerBusinessExplorer />;
}

// A card that opens and closes on click. Each card opens on its own.
function ExpandCard({ title, teaser, children, tone = "line", defaultOpen = false, image, imageAlt = "", className = "" }) {
    const [open, setOpen] = useState(defaultOpen);
    const tones = {
        line: "bg-[var(--afx-bg)] border border-[var(--afx-line)]",
        surface: "bg-[var(--afx-surface)] border border-[var(--afx-line)]",
        gold: "bg-[var(--afx-gold)] text-white dark:text-[#14110B]",
        ink: "bg-[#1B1710] text-[#F3ECDA] dark:bg-[#2A2312]",
    };
    const loud = tone === "gold" || tone === "ink";
    const muted = loud ? "opacity-85" : "text-[var(--afx-muted)]";
    return (
        <article className={`${tones[tone]} ${className}`}>
            {image && (
                <div className="aspect-[16/9] overflow-hidden">
                    <Img src={u(image, 800)} alt={imageAlt} className="w-full h-full" />
                </div>
            )}
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
                className={`w-full text-left p-6 flex items-start justify-between gap-4 ${loud ? "afx-focus-current" : ""}`}>
                <span>
                    <span className="afx-serif text-2xl block leading-snug">{title}</span>
                    <span className={`block mt-2 text-sm ${muted}`}>{teaser}</span>
                </span>
                <Plus size={20} className={`shrink-0 mt-1.5 transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
            </button>
            <div className={`grid transition-all duration-500 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                    <div className={`px-6 pb-6 text-sm leading-relaxed ${muted}`}>{children}</div>
                </div>
            </div>
        </article>
    );
}

function Faq({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-[var(--afx-line)]">
            <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between gap-6 py-5 text-left">
                <span className="afx-serif text-lg">{q}</span>
                <ChevronDown size={20} className={`shrink-0 text-[var(--afx-gold)] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <p className="overflow-hidden text-[var(--afx-muted)] max-w-2xl leading-relaxed pr-10">
                    <span className="block pb-5">{a}</span>
                </p>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Page() {
    const { theme } = useThemeContext();
    const fade = theme === "dark" ? "#14110B" : "#FAF6EC";

    return (
        <div className="afx">
            <style>{CSS}</style>

            {/* HERO */}
            <section className="afx-hero relative px-6 md:px-16 lg:px-24 xl:px-32 pt-32 pb-24 grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
                <div className="relative z-10">
                    <p className="afx-rise text-sm text-[var(--afx-gold-deep)] font-medium">Aurum FX · Business network</p>
                    <h1 className="afx-rise afx-serif mt-4 text-5xl md:text-6xl lg:text-[68px] leading-[1.04] font-semibold max-w-2xl" style={{ animationDelay: "80ms" }}>
                        Building India's business network, one district at a time.
                    </h1>
                    <p className="afx-rise mt-6 text-lg text-[var(--afx-muted)] max-w-xl leading-relaxed" style={{ animationDelay: "160ms" }}>
                        Aurum FX is building a network of businesses across every state and district. Our field teams meet each business in person, so every name in the network is real, verified and ready for you to reach.
                    </p>
                    <div className="afx-rise flex flex-wrap items-center gap-4 mt-9" style={{ animationDelay: "240ms" }}>
                        <a href="#coverage" className="afx-btn-gold inline-flex items-center gap-2 px-6 h-12 font-medium">
                            Explore the network <ArrowRight size={18} />
                        </a>
                        <a href="#contact" className="afx-btn-line inline-flex items-center gap-2 px-6 h-12 font-medium">
                            <Phone size={17} /> Talk to our team
                        </a>
                    </div>
                    <ul className="afx-rise mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--afx-muted)]" style={{ animationDelay: "320ms" }}>
                        {[[Footprints, "Met in person by field staff"], [BadgeCheck, "Verified on site"], [Globe2, "Connected across India"]].map(([Icon, t]) => (
                            <li key={t} className="flex items-center gap-2">{createElement(Icon, { size: 17, className: "text-[var(--afx-gold)]" })} {t}</li>
                        ))}
                    </ul>
                </div>

                <div className="afx-rise relative pb-10 lg:pb-0" style={{ animationDelay: "200ms" }}>
                    <div className="afx-frame">
                        <Slider slides={HERO_SLIDES} showDots className="w-full aspect-[4/5]" />
                    </div>
                    <div className="hidden md:block absolute -left-10 lg:-left-16 -bottom-2 lg:bottom-8 w-44 lg:w-52 afx-frame-sm">
                        <Slider slides={HERO_SMALL} start={2} interval={3300} className="aspect-square w-full" />
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="px-6 md:px-16 lg:px-24 xl:px-32">
                <dl className="grid grid-cols-2 lg:grid-cols-4 border-y border-[var(--afx-line)]">
                    {STATS.map((s, i) => (
                        <div key={s.label} className={`py-8 px-2 lg:px-8 ${i > 0 ? "lg:border-l border-[var(--afx-line)]" : ""}`}>
                            <dd className="afx-serif text-4xl md:text-5xl font-semibold text-[var(--afx-gold-deep)]">
                                <CountUp to={s.value} suffix={s.suffix} />
                            </dd>
                            <dt className="mt-1 text-sm text-[var(--afx-muted)]">{s.label}</dt>
                        </div>
                    ))}
                </dl>
            </section>

            {/* CATEGORY MARQUEE */}
            <section className="pt-16 pb-6">
                <p className="px-6 md:px-16 lg:px-24 xl:px-32 text-[var(--afx-muted)] mb-6">The businesses our teams record include</p>
                <Marquee gradient gradientColor={fade} gradientWidth={90} speed={32} pauseOnHover>
                    {CATEGORIES.map(({ icon: Icon, name }) => (
                        <div key={name} className="flex items-center gap-2.5 mx-3 px-5 py-3 border border-[var(--afx-line)] bg-[var(--afx-surface)]">
                            {createElement(Icon, { size: 18, strokeWidth: 1.5, className: "text-[var(--afx-gold)]" })}
                            <span className="text-sm whitespace-nowrap">{name}</span>
                        </div>
                    ))}
                </Marquee>
            </section>

            {/* ABOUT */}
            <section id="about" className="px-6 md:px-16 lg:px-24 xl:px-32 py-24">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="afx-serif text-4xl md:text-5xl font-semibold leading-tight max-w-xl">Business partners in every district, in every state</h2>
                        <p className="mt-6 text-lg text-[var(--afx-muted)] leading-relaxed max-w-xl">
                            Aurum FX started with a simple idea: the best way to know a district's businesses is to go and meet them. Our field teams visit shops, traders and makers in person, and every business they record becomes part of one directory.
                        </p>
                        <p className="mt-4 text-[var(--afx-muted)] leading-relaxed max-w-xl">
                            Today that directory is built with business partners across states and districts, and it keeps growing with every field visit.
                        </p>
                    </div>
                    <div className="afx-frame">
                        <Slider slides={PARTNER_SLIDES} showDots interval={4800} className="w-full aspect-[5/4]" />
                    </div>
                </div>

                {/* TODO: check each card's wording against how your field teams really work */}
                <div className="mt-20 grid lg:grid-cols-6 gap-5 items-start">
                    <ExpandCard tone="surface" defaultOpen className="lg:col-span-4"
                        title="What happens on a visit"
                        teaser="A short chat, a form and a photo of the shop front.">
                        <p className="max-w-xl">
                            Our field staff member walks in, says who we are, and asks the owner a few plain questions. Whatever they find is entered in the field staff dashboard.
                        </p>
                        <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 text-[var(--afx-text)]">
                            {[["Business name", "as it appears on the board"], ["Category", "what the shop mainly sells"], ["Address", "with a landmark nearby"], ["Contact", "a number a buyer can call"], ["Photo", "of the shop front"], ["Visit record", "date and staff ID"]].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4 py-2 border-b border-[var(--afx-line)]">
                                    <dt className="font-medium">{k}</dt>
                                    <dd className="text-[var(--afx-muted)] text-right">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </ExpandCard>

                    <ExpandCard tone="gold" className="lg:col-span-2"
                        title="Why we go in person"
                        teaser="A phone listing can't tell you if the shutter is up.">
                        <p>
                            Online listings go stale, and addresses are often a street off. Someone standing at the door can see that the shop is open, what is on the shelves and who to ask for.
                        </p>
                    </ExpandCard>

                    <ExpandCard tone="line" className="lg:col-span-2" image={P.loom} imageAlt="A weaver at a handloom"
                        title="Not just one kind of shop"
                        teaser="From kirana stores to jewellers, cafes to weavers.">
                        <p>
                            We don't filter by size. A corner vegetable stall and a wholesale cloth merchant get the same kind of record, so a buyer can compare them side by side.
                        </p>
                    </ExpandCard>

                    <ExpandCard tone="line" className="lg:col-span-2 border-l-4 !border-l-[var(--afx-gold)]"
                        title="Our one rule"
                        teaser="Fewer businesses we have seen beat many we haven't.">
                        <p>
                            If a shop hasn't been visited yet, it stays off the directory until it has. Coverage grows a little slower this way, and every listing stays honest.
                        </p>
                    </ExpandCard>

                    <ExpandCard tone="ink" className="lg:col-span-2"
                        title="Still growing"
                        teaser="New districts are added as visits finish.">
                        <ul className="space-y-2 list-disc pl-5 marker:text-[var(--afx-gold)]">
                            <li>More districts and more business categories</li>
                            <li>Repeat visits to refresh older listings</li>
                            <li>A login for field staff to add records themselves</li>
                        </ul>
                    </ExpandCard>
                </div>
            </section>

            {/* GROWTH */}
            <section className="px-6 md:px-16 lg:px-24 xl:px-32 pb-24">
                <h3 className="afx-serif text-3xl md:text-4xl font-semibold max-w-xl leading-tight">How we have grown</h3>
                <ol className="mt-12 grid md:grid-cols-4 gap-x-8 gap-y-10 border-t border-[var(--afx-line)]">
                    {GROWTH.map((g) => (
                        <li key={g.title} className="relative pt-8">
                            <span className="absolute -top-[7px] left-0 size-3.5 rounded-full bg-[var(--afx-gold)] ring-4 ring-[var(--afx-bg)]" />
                            <p className="text-sm text-[var(--afx-gold-deep)] font-medium">{g.phase}</p>
                            <h4 className="afx-serif text-xl mt-1">{g.title}</h4>
                            <p className="mt-2 text-sm text-[var(--afx-muted)] leading-relaxed">{g.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* PARTNER NETWORK */}
            <section className="py-16 bg-[var(--afx-surface)] border-y border-[var(--afx-line)]">
                <p className="px-6 md:px-16 lg:px-24 xl:px-32 afx-serif text-2xl md:text-3xl mb-8 max-w-2xl">Our partner network spans every state</p>
                <Marquee gradient gradientColor={theme === "dark" ? "#1C1810" : "#F2EBD8"} gradientWidth={90} speed={28} direction="right" pauseOnHover>
                    {ALL_STATES.map((st) => (
                        <span key={st} className="mx-3 px-5 py-2.5 border border-[var(--afx-line)] bg-[var(--afx-bg)] text-sm whitespace-nowrap flex items-center gap-2">
                            <MapPin size={14} className="text-[var(--afx-gold)]" /> {st}
                        </span>
                    ))}
                </Marquee>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="px-6 md:px-16 lg:px-24 xl:px-32 py-24">
                <h2 className="afx-serif text-4xl md:text-5xl font-semibold max-w-2xl leading-tight">From a shop front to a verified listing</h2>
                <p className="mt-4 text-[var(--afx-muted)] max-w-xl">Four steps, repeated in every district.</p>
                <ol className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
                    {STEPS.map(({ icon: Icon, title, text }, i) => (
                        <li key={title} className="relative pt-6 border-t-2 border-[var(--afx-gold)]">
                            <span className="afx-mono absolute -top-3 left-0 bg-[var(--afx-bg)] pr-3 text-xs text-[var(--afx-gold-deep)]">Step {i + 1}</span>
                            {createElement(Icon, { size: 26, strokeWidth: 1.4, className: "text-[var(--afx-gold)]" })}
                            <h3 className="afx-serif text-2xl mt-4">{title}</h3>
                            <p className="mt-2 text-[var(--afx-muted)] leading-relaxed">{text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* DIRECTORY */}
            <section id="coverage" className="px-6 md:px-16 lg:px-24 xl:px-32 py-24 bg-[var(--afx-surface)] border-y border-[var(--afx-line)]">
                <h2 className="afx-serif text-4xl md:text-5xl font-semibold max-w-3xl leading-tight">Browse businesses by state and district</h2>
                <p className="mt-4 text-[var(--afx-muted)] max-w-xl">Pick a state, then a district, to see what our field teams have recorded there.</p>
                <DirectoryExplorer />
                <div className="mt-8">
                    <Link to="/browse-districts" className="afx-btn-line inline-flex h-12 items-center gap-2 px-6 font-medium">
                        Open full district directory <ArrowRight size={17} />
                    </Link>
                </div>
            </section>

            {/* PHOTO MOSAIC */}
            <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-24">
                <h2 className="afx-serif text-4xl md:text-5xl font-semibold max-w-2xl leading-tight">Local trades, recorded properly</h2>
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[560px]">
                    {[
                        { id: P.vegShop, label: "Vegetable & grocery shops", cls: "md:col-span-2 md:row-span-2" },
                        { id: P.bags, label: "Textile shops", cls: "" },
                        { id: P.cafe, label: "Cafes & food", cls: "" },
                        { id: P.gold, label: "Jewellery", cls: "" },
                        { id: P.spices, label: "Spices & provisions", cls: "" },
                    ].map((t) => (
                        <figure key={t.label} className={`afx-tile relative overflow-hidden min-h-[200px] ${t.cls}`}>
                            <Img src={u(t.id, 900)} alt={t.label} className="absolute inset-0 w-full h-full" />
                            <figcaption className="absolute inset-x-0 bottom-0 p-4 pt-12 text-white font-medium bg-gradient-to-t from-black/70 to-transparent">{t.label}</figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            {/* TRUST */}
            <section className="px-6 md:px-16 lg:px-24 xl:px-32 pb-24 grid lg:grid-cols-2 gap-14 items-center">
                <div className="afx-frame">
                    <Slider slides={[{ id: P.street, label: "Market streets" }, { id: P.charminar, label: "Old city bazaars" }, { id: P.night, label: "Bazaars at night" }]} interval={5000} className="w-full aspect-[5/4]" />
                </div>
                <div>
                    <h2 className="afx-serif text-4xl md:text-5xl font-semibold leading-tight">Why customers trust the directory</h2>
                    <ul className="mt-10 space-y-7">
                        {TRUST.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="flex gap-4">
                                {createElement(Icon, { size: 24, strokeWidth: 1.4, className: "text-[var(--afx-gold)] shrink-0 mt-1" })}
                                <div>
                                    <h3 className="font-semibold">{title}</h3>
                                    <p className="text-[var(--afx-muted)] mt-1 leading-relaxed">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* QUOTES */}
            <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-24 bg-[var(--afx-surface)] border-y border-[var(--afx-line)]">
                <h2 className="afx-serif text-4xl md:text-5xl font-semibold max-w-2xl leading-tight">What customers tell us</h2>
                <div className="mt-12 grid md:grid-cols-3 gap-10">
                    {QUOTES.map((q) => (
                        <blockquote key={q.who} className="border-l-2 border-[var(--afx-gold)] pl-6">
                            <p className="afx-serif text-xl leading-snug">{q.text}</p>
                            <footer className="mt-5 text-sm text-[var(--afx-muted)]">{q.who}, {q.org}</footer>
                        </blockquote>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="px-6 md:px-16 lg:px-24 xl:px-32 py-24 grid lg:grid-cols-[1fr_1.4fr] gap-12">
                <h2 className="afx-serif text-4xl md:text-5xl font-semibold leading-tight">Questions, answered</h2>
                <div className="border-t border-[var(--afx-line)]">
                    {FAQS.map((f) => <Faq key={f.q} {...f} />)}
                </div>
            </section>

            {/* CTA */}
            <section id="contact-cta" className="px-6 md:px-16 lg:px-24 xl:px-32 pb-24">
                <div className="afx-cta px-8 md:px-16 py-16 md:py-20">
                    <h2 className="afx-serif text-4xl md:text-5xl font-semibold max-w-2xl leading-tight">Tell us which districts you need</h2>
                    <p className="mt-4 max-w-xl opacity-80 text-lg">Share the regions and business types you want to reach. Our team will show you what we have recorded.</p>
                    <div className="flex flex-wrap gap-4 mt-9">
                        <a href="mailto:info@aurumfx.in" className="afx-btn-gold inline-flex items-center gap-2 px-6 h-12 font-medium">
                            Contact Aurum FX <ArrowRight size={18} />
                        </a>
                        <a href="#coverage" className="inline-flex items-center px-6 h-12 border border-white/30 text-white hover:border-white/70 transition-colors">
                            Browse districts
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Styles (scoped to .afx, light + dark)                                      */
/* -------------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

html{scroll-behavior:smooth}
.afx section[id]{scroll-margin-top:84px}
.afx{
  --afx-bg:#FAF6EC; --afx-surface:#F2EBD8; --afx-ink:#1B1710; --afx-text:#1B1710;
  --afx-muted:#6B6350; --afx-line:#DDD2B4; --afx-gold:#B08225; --afx-gold-deep:#8A6420;
  background:var(--afx-bg); color:var(--afx-text); font-family:'Inter',system-ui,sans-serif; overflow-x:hidden;
}
.dark .afx{
  --afx-bg:#14110B; --afx-surface:#1C1810; --afx-ink:#F3ECDA; --afx-text:#F3ECDA;
  --afx-muted:#A89F88; --afx-line:#3A3321; --afx-gold:#D9AE4B; --afx-gold-deep:#E3BF68;
}
.afx-serif{font-family:'Fraunces',Georgia,serif; letter-spacing:-0.01em}
.afx-mono{font-family:'JetBrains Mono',ui-monospace,monospace}

.afx-hero::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(60% 55% at 85% 35%, color-mix(in srgb, var(--afx-gold) 22%, transparent), transparent 70%);
}

.afx-btn-gold{background:var(--afx-gold); color:#fff; transition:background .2s, transform .2s}
.afx-btn-gold:hover{background:var(--afx-gold-deep); transform:translateY(-1px)}
.dark .afx-btn-gold{color:#14110B}
.afx-btn-line{border:1px solid var(--afx-gold); color:var(--afx-gold-deep); transition:background .2s}
.afx-btn-line:hover{background:color-mix(in srgb, var(--afx-gold) 12%, transparent)}
.afx a:focus-visible,.afx button:focus-visible{outline:2px solid var(--afx-gold); outline-offset:3px}
.afx button.afx-focus-current:focus-visible{outline-color:currentColor; outline-offset:-4px}

/* fine gold frames, like a certificate border */
.afx-frame{outline:1px solid var(--afx-gold); outline-offset:10px; margin:10px}
.afx-frame-sm{border:5px solid var(--afx-bg); outline:1px solid var(--afx-gold); box-shadow:0 20px 40px -18px rgba(60,40,0,.5)}
.afx-fallback{background:linear-gradient(135deg,#E9D7A5,#B08225)}
.afx-tile img{transition:transform .6s ease}
.afx-tile:hover img{transform:scale(1.05)}
.afx-card{transition:box-shadow .3s, border-color .3s}
.afx-card:hover{border-color:var(--afx-gold); box-shadow:0 18px 34px -22px rgba(60,40,0,.55)}
.afx-cta{background:#1B1710; color:#F3ECDA; border:1px solid #B08225; outline:1px solid #B08225; outline-offset:8px; margin:8px}
.dark .afx-cta{background:#1C1810}

@keyframes afx-rise{from{opacity:0; transform:translateY(18px)} to{opacity:1; transform:none}}
@keyframes afx-swap{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none}}
@keyframes afx-kb{from{transform:scale(1)} to{transform:scale(1.12)}}
@keyframes afx-grow{from{transform:scaleX(0)} to{transform:scaleX(1)}}
.afx-rise{opacity:0; animation:afx-rise .8s cubic-bezier(.2,.7,.2,1) forwards}
.afx-swap{opacity:0; animation:afx-swap .45s ease-out forwards}
.afx-kb{animation:afx-kb 7s ease-out forwards}
.afx-grow{transform-origin:left; animation:afx-grow .9s cubic-bezier(.2,.7,.2,1) both}
@media (prefers-reduced-motion:reduce){
  .afx-rise,.afx-swap,.afx-grow{animation:none; opacity:1; transform:none}
  .afx-kb{animation:none}
  .afx-tile img,.afx-btn-gold{transition:none}
}
`;