import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CalendarDays, MapPin, RefreshCw, Store, TrendingUp } from "lucide-react";
import { getStaffDashboardSummary } from "../api/staffDashboard";

const EMPTY_DASHBOARD = {
    staff: { name: "", staff_id: "", district: "" },
    summary: { total_businesses: 0, today_added: 0, this_week_added: 0, this_month_added: 0, this_year_added: 0 },
    business_categories: [], districts: [], locations: [], businesses: [],
};

const STAT_CARDS = [
    { label: "Total businesses", key: "total_businesses", icon: Store, highlight: true },
    { label: "Added today", key: "today_added", icon: Building2 },
    { label: "Added this week", key: "this_week_added", icon: CalendarDays },
    { label: "Added this month", key: "this_month_added", icon: CalendarDays },
    { label: "Added this year", key: "this_year_added", icon: TrendingUp },
];

const PALETTE = ["var(--d-gold)", "#7A5A17", "#D9AE4B", "#A8803A", "#E3BF68", "#5E4712"];
const fmt = (n) => (n ?? 0).toLocaleString("en-IN");

function Card({ title, subtitle, children, className = "", delay = 0 }) {
    return (
        <section className={`afx-card afx-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>
            <div className="px-6 pt-5">
                <h2 className="afx-serif text-xl font-semibold">{title}</h2>
                {subtitle && <p className="text-xs text-[var(--d-muted)] mt-0.5">{subtitle}</p>}
            </div>
            <div className="p-6 pt-4">{children}</div>
        </section>
    );
}

function formatDate(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/* Smooth area chart: businesses added per day, last 14 days (from the response list) */
function AreaChart({ points }) {
    const W = 640, H = 220, P = { l: 30, r: 12, t: 16, b: 28 };
    const max = Math.max(1, ...points.map((p) => p.value));
    const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, points.length - 1);
    const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
    const area = `${line} L${x(points.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Businesses added per day">
            <defs>
                <linearGradient id="afxArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--d-gold)" stopOpacity=".38" />
                    <stop offset="100%" stopColor="var(--d-gold)" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 0.5, 1].map((t) => (
                <g key={t}>
                    <line x1={P.l} x2={W - P.r} y1={y(max * t)} y2={y(max * t)} stroke="var(--d-line)" strokeDasharray="3 4" />
                    <text x={P.l - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="var(--d-muted)">{Math.round(max * t)}</text>
                </g>
            ))}
            <path d={area} fill="url(#afxArea)" className="afx-fade" />
            <path d={line} fill="none" stroke="var(--d-gold)" strokeWidth="2.5" strokeLinejoin="round" pathLength="1000" style={{ "--len": 1000 }} className="afx-draw" />
            {points.map((p, i) => (
                <g key={p.label} className="afx-fade">
                    <circle cx={x(i)} cy={y(p.value)} r="3.5" fill="var(--d-card)" stroke="var(--d-gold)" strokeWidth="2"><title>{`${p.label}: ${p.value}`}</title></circle>
                    {i % 2 === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--d-muted)">{p.label}</text>}
                </g>
            ))}
        </svg>
    );
}

function Donut({ items }) {
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    const R = 52, C = 2 * Math.PI * R;
    let offset = 0;
    return (
        <div className="flex flex-wrap items-center gap-6">
            <svg viewBox="0 0 140 140" className="size-40 -rotate-90 shrink-0" role="img" aria-label="Category share">
                <circle cx="70" cy="70" r={R} fill="none" stroke="var(--d-line)" strokeWidth="16" />
                {items.map((item, i) => {
                    const len = (item.count / total) * C;
                    const el = (
                        <circle key={item.category} cx="70" cy="70" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="16"
                            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} className="afx-fade"
                            style={{ animationDelay: `${i * 120}ms` }}><title>{`${item.category}: ${item.count}`}</title></circle>
                    );
                    offset += len;
                    return el;
                })}
                <g className="rotate-90 origin-center">
                    <text x="70" y="68" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--d-text)" className="afx-serif">{fmt(total)}</text>
                    <text x="70" y="84" textAnchor="middle" fontSize="9" fill="var(--d-muted)">businesses</text>
                </g>
            </svg>
            <ul className="flex-1 min-w-[180px] space-y-3">
                {items.map((item, i) => (
                    <li key={item.category} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 min-w-0"><span className="size-2.5 shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} /><span className="truncate">{item.category}</span></span>
                        <span className="text-[var(--d-muted)]">{Math.round((item.count / total) * 100)}% · {fmt(item.count)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function BarList({ items, labelKey, icon: Icon }) {
    const max = Math.max(1, ...items.map((i) => i.count));
    return (
        <ul className="space-y-4">
            {items.map((item, i) => (
                <li key={item[labelKey]}>
                    <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                        <span className="flex items-center gap-2 min-w-0">{Icon && <Icon size={15} className="text-[var(--d-gold)] shrink-0" />}<span className="truncate font-medium">{item[labelKey]}</span></span>
                        <span className="text-[var(--d-muted)]">{fmt(item.count)}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--d-line)]"><div className="afx-fill h-full bg-[var(--d-gold)]" style={{ width: `${(item.count / max) * 100}%`, animationDelay: `${i * 80}ms` }} /></div>
                </li>
            ))}
        </ul>
    );
}

function PeriodBars({ summary }) {
    const data = [["Today", summary.today_added], ["Week", summary.this_week_added], ["Month", summary.this_month_added], ["Year", summary.this_year_added]];
    const max = Math.max(1, ...data.map((d) => d[1]));
    return (
        <div className="flex items-end justify-between gap-4 h-44">
            {data.map(([label, value], i) => (
                <div key={label} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                    <span className="text-sm font-semibold">{fmt(value)}</span>
                    <div className="afx-bar w-full max-w-[56px] bg-gradient-to-t from-[var(--d-gold-deep)] to-[var(--d-gold)]" style={{ height: `${Math.max(4, (value / max) * 100)}%`, animationDelay: `${i * 120}ms` }} />
                    <span className="text-xs text-[var(--d-muted)]">{label}</span>
                </div>
            ))}
        </div>
    );
}

const Empty = ({ children }) => <p className="text-sm text-[var(--d-muted)]">{children}</p>;

export default function StaffDashboard() {
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const r = await getStaffDashboardSummary();
            setDashboard({ staff: r.staff, summary: r.summary, business_categories: r.business_categories, districts: r.districts, locations: r.locations, businesses: r.businesses });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const daily = useMemo(() => {
        const days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (13 - i));
            return { key: d.toDateString(), label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: 0 };
        });
        dashboard.businesses.forEach((b) => {
            const hit = b.created_at && days.find((d) => d.key === new Date(b.created_at).toDateString());
            if (hit) hit.value += 1;
        });
        return days;
    }, [dashboard.businesses]);

    const { summary, staff } = dashboard;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="afx-rise flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="afx-serif text-3xl font-semibold">Welcome{staff.name ? `, ${staff.name}` : ""}</h2>
                    <p className="mt-1 text-[var(--d-muted)]">{staff.district ? `Your assigned district: ${staff.district}` : "Your business network at a glance."}</p>
                </div>
                <button type="button" onClick={loadDashboard} disabled={loading} className="afx-btn-ghost">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {error && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-4 border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-5 py-4 text-sm">
                    <span className="flex items-start gap-2 text-[var(--d-err)]"><AlertCircle size={17} className="shrink-0 mt-0.5" />{error}</span>
                    <button type="button" onClick={loadDashboard} disabled={loading} className="font-medium text-[var(--d-gold-deep)] hover:underline">Try again</button>
                </div>
            )}

            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-5">
                {STAT_CARDS.map((item, index) => (
                    <div key={item.key} style={{ animationDelay: `${60 + index * 70}ms` }}
                        className={`afx-rise afx-lift p-5 border ${item.highlight ? "bg-gradient-to-br from-[var(--d-gold)] to-[var(--d-gold-deep)] border-[var(--d-gold)] text-white dark:text-[#14110B]" : "afx-card"}`}>
                        <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm ${item.highlight ? "opacity-90" : "text-[var(--d-muted)]"}`}>{item.label}</p>
                            <span className={`grid place-items-center size-9 ${item.highlight ? "bg-white/20" : "bg-[var(--d-glow)]"}`}>
                                <item.icon size={17} strokeWidth={1.7} className={item.highlight ? "" : "text-[var(--d-gold)]"} />
                            </span>
                        </div>
                        <p className="afx-serif text-4xl font-semibold mt-3">{loading ? "—" : fmt(summary[item.key])}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                <Card title="Recent activity" subtitle="Businesses added per day, last 14 days" className="lg:col-span-2" delay={180}>
                    {loading ? <Empty>Loading chart…</Empty> : <AreaChart points={daily} />}
                </Card>
                <Card title="Growth by period" subtitle="How many you added" delay={240}>
                    {loading ? <Empty>Loading…</Empty> : <PeriodBars summary={summary} />}
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                <Card title="Business categories" subtitle="Share of all businesses" className="lg:col-span-2" delay={300}>
                    {loading ? <Empty>Loading categories…</Empty> : dashboard.business_categories.length ? <Donut items={dashboard.business_categories} /> : <Empty>No category data available.</Empty>}
                </Card>
                <Card title="Locations" delay={360}>
                    {loading ? <Empty>Loading locations…</Empty> : dashboard.locations.length ? <BarList items={dashboard.locations} labelKey="location" icon={MapPin} /> : <Empty>No location data available.</Empty>}
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                <Card title="Recent businesses" className="lg:col-span-2" delay={420}>
                    {loading ? <Empty>Loading businesses…</Empty> : dashboard.businesses.length ? (
                        <div className="overflow-x-auto -mx-6">
                            <table className="afx-table w-full text-sm min-w-[600px]">
                                <thead><tr><th>Business</th><th>Category</th><th>Location</th><th className="text-right">Added</th></tr></thead>
                                <tbody>
                                    {dashboard.businesses.map((b) => (
                                        <tr key={b.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <span className="afx-avatar !size-9 text-sm">{(b.business_name || "?")[0].toUpperCase()}</span>
                                                    <div><p className="font-medium">{b.business_name}</p><p className="text-xs text-[var(--d-muted)]">{b.owner_name}</p></div>
                                                </div>
                                            </td>
                                            <td><span className="afx-chip">{b.business_category || b.business_type || "—"}</span></td>
                                            <td className="text-[var(--d-muted)]">{[b.city, b.district].filter(Boolean).join(", ") || b.address || "—"}</td>
                                            <td className="text-right text-[var(--d-muted)]">{formatDate(b.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <Empty>No businesses recorded yet.</Empty>}
                </Card>
                <Card title="Districts" delay={480}>
                    {loading ? <Empty>Loading districts…</Empty> : dashboard.districts.length ? <BarList items={dashboard.districts} labelKey="district" /> : <Empty>No district data available.</Empty>}
                </Card>
            </div>
        </div>
    );
}