import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Building2, MapPin, RefreshCw, TrendingUp, UserCheck, UserX, Users } from "lucide-react";
import { getAdminData, getAdminToken } from "../api/adminLogin";
import { getAdminDashboardSummary } from "../api/adminDashboard";

const EMPTY_DATA = {
    summary: { total_staff: 0, active_staff: 0, deactivated_staff: 0, total_businesses: 0 },
    businesses: { today: 0, this_week: 0, this_month: 0, this_year: 0 },
    business_categories: [], states: [], districts: [], locations: [],
};

const fmt = (n) => (n ?? 0).toLocaleString("en-IN");
const PALETTE = ["#B08225", "#862A42", "#D9AE4B", "#C98A98", "#8A6420", "#E6C3CC"];
const TABS = [
    { id: "states", label: "States", key: "state" },
    { id: "districts", label: "Districts", key: "district" },
    { id: "locations", label: "Locations", key: "location" },
];
const GROWTH = [["Today", "today"], ["This week", "this_week"], ["This month", "this_month"], ["This year", "this_year"]];

function Panel({ title, subtitle, right, children, className = "", delay = 0 }) {
    return (
        <section className={`ad-panel ${className}`} style={{ animationDelay: `${delay}ms` }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="ad-display text-xl font-bold">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-xs text-[var(--ad-muted)]">{subtitle}</p>}
                </div>
                {right}
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}

/* KPI card with a progress ring showing its share of the total */
function Kpi({ label, value, total, icon: Icon, color, loading, delay, note }) {
    const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
    const R = 26, C = 2 * Math.PI * R;
    return (
        <div className="ad-panel ad-lift flex items-center justify-between gap-4" style={{ animationDelay: `${delay}ms` }}>
            <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--ad-muted)]"><Icon size={16} style={{ color }} />{label}</p>
                <p className="ad-display mt-2 text-4xl font-bold">{loading ? "—" : fmt(value)}</p>
                <p className="mt-1 text-xs text-[var(--ad-muted)]">{note}</p>
            </div>
            <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" role="img" aria-label={`${pct}%`}>
                <circle cx="32" cy="32" r={R} fill="none" stroke="var(--ad-line)" strokeWidth="6" />
                <circle cx="32" cy="32" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} className="ad-ring" style={{ "--c": C }} />
                <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ad-text)" className="rotate-90 origin-center">{pct}%</text>
            </svg>
        </div>
    );
}

function GrowthChart({ data, loading }) {
    const max = Math.max(1, ...GROWTH.map(([, k]) => data[k] || 0));
    return (
        <div className="relative">
            <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <div key={i} className="border-t border-dashed border-[var(--ad-line)]" />)}
            </div>
            <div className="relative flex h-60 items-end gap-5 px-2">
                {GROWTH.map(([label, key], i) => {
                    const v = data[key] || 0;
                    return (
                        <div key={key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                            <span className="text-sm font-bold">{loading ? "—" : fmt(v)}</span>
                            <div className="ad-col w-full max-w-[72px] rounded-t-2xl" style={{ height: `calc(${Math.max(4, (v / max) * 100)}% - 40px)`, minHeight: 6, animationDelay: `${i * 120}ms` }} />
                            <span className="h-6 text-xs font-medium text-[var(--ad-muted)]">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Donut({ items, loading }) {
    if (loading) return <p className="text-sm text-[var(--ad-muted)]">Loading…</p>;
    if (!items.length) return <p className="text-sm text-[var(--ad-muted)]">No data available.</p>;
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    const R = 56, C = 2 * Math.PI * R;
    let offset = 0;
    return (
        <div className="flex flex-col items-center gap-6">
            <svg viewBox="0 0 150 150" className="size-44 -rotate-90" role="img" aria-label="Category share">
                <circle cx="75" cy="75" r={R} fill="none" stroke="var(--ad-line)" strokeWidth="18" />
                {items.map((item, i) => {
                    const len = (item.count / total) * C;
                    const el = <circle key={item.category} cx="75" cy="75" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="18"
                        strokeDasharray={`${Math.max(0, len - 2)} ${C - len + 2}`} strokeDashoffset={-offset} className="ad-seg" style={{ animationDelay: `${i * 140}ms` }}><title>{`${item.category}: ${item.count}`}</title></circle>;
                    offset += len;
                    return el;
                })}
                <g className="rotate-90 origin-center">
                    <text x="75" y="75" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--ad-text)" className="ad-display">{fmt(total)}</text>
                    <text x="75" y="92" textAnchor="middle" fontSize="9" fill="var(--ad-muted)">businesses</text>
                </g>
            </svg>
            <ul className="w-full space-y-2.5">
                {items.map((item, i) => (
                    <li key={item.category} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2.5"><span className="size-3 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} /><span className="truncate">{item.category}</span></span>
                        <span className="shrink-0 font-semibold">{Math.round((item.count / total) * 100)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Ranked({ items, labelKey, loading }) {
    if (loading) return <p className="text-sm text-[var(--ad-muted)]">Loading…</p>;
    if (!items.length) return <p className="text-sm text-[var(--ad-muted)]">No data available.</p>;
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    const max = Math.max(1, ...items.map((i) => i.count));
    return (
        <ul className="grid gap-x-12 gap-y-5 md:grid-cols-2">
            {items.map((item, i) => (
                <li key={item[labelKey]} className="flex items-center gap-4">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${i < 3 ? "ad-crest text-[#2B0B14]" : "bg-[var(--ad-bg)] text-[var(--ad-muted)]"}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <span className="truncate font-semibold">{item[labelKey]}</span>
                            <span className="shrink-0 text-[var(--ad-muted)]">{fmt(item.count)} · {Math.round((item.count / total) * 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--ad-bg)]"><div className="ad-bar h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, animationDelay: `${i * 70}ms` }} /></div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const token = getAdminToken();
    const adminName = getAdminData()?.name;
    const [data, setData] = useState(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState(TABS[0].id);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setData(await getAdminDashboardSummary());
        } catch (requestError) {
            setError(requestError.message);
            if (!getAdminToken()) navigate("/admin", { replace: true });
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { if (token) load(); }, [load, token]);

    const { summary, businesses } = data;
    const activeTab = TABS.find((t) => t.id === tab);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <style>{CSS}</style>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="ad-welcome">
                    <h2 className="ad-display text-3xl font-bold">Welcome back{adminName ? `, ${adminName}` : ""} <span className="ad-wave" aria-hidden="true">👋</span></h2>
                    <p className="mt-1 text-[var(--ad-muted)]">Here is an overview of your organization and business activity today.</p>
                </div>
                <button type="button" onClick={load} disabled={loading} className="ad-btn"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </div>

            {error && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    <span className="flex items-start gap-2"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</span>
                    <button type="button" onClick={load} className="font-semibold underline">Try again</button>
                </div>
            )}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Organization summary">
                <div className="ad-gold ad-lift rounded-[22px] p-6 text-[#2B0B14]" style={{ animationDelay: "0ms" }}>
                    <p className="flex items-center gap-2 text-sm font-semibold"><Building2 size={16} />Total businesses</p>
                    <p className="ad-display mt-2 text-5xl font-bold">{loading ? "—" : fmt(summary.total_businesses)}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold"><TrendingUp size={14} />+{fmt(businesses.this_month)} this month</p>
                </div>
                <Kpi label="Total staff" value={summary.total_staff} total={summary.total_staff} icon={Users} color="#862A42" loading={loading} delay={70} note="All field staff accounts" />
                <Kpi label="Active staff" value={summary.active_staff} total={summary.total_staff} icon={UserCheck} color="#B08225" loading={loading} delay={140} note="Currently able to sign in" />
                <Kpi label="Deactivated staff" value={summary.deactivated_staff} total={summary.total_staff} icon={UserX} color="#7A828C" loading={loading} delay={210} note="Access turned off" />
            </section>

            <div className="grid gap-5 lg:grid-cols-3">
                <Panel title="Businesses added" subtitle="New records by period" className="lg:col-span-2" delay={260}>
                    <GrowthChart data={businesses} loading={loading} />
                </Panel>
                <Panel title="Business categories" subtitle="Share of all businesses" delay={320}>
                    <Donut items={data.business_categories} loading={loading} />
                </Panel>
            </div>

            <Panel title="Where businesses are" subtitle="Top areas ranked by number of businesses" delay={380}
                right={
                    <div className="inline-flex rounded-2xl bg-[var(--ad-bg)] p-1" role="tablist">
                        {TABS.map((t) => (
                            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-[var(--ad-green)] text-white shadow-md" : "text-[var(--ad-muted)] hover:text-[var(--ad-text)]"}`}>
                                {tab === t.id && <MapPin size={14} />}{t.label}
                            </button>
                        ))}
                    </div>
                }>
                <Ranked key={tab} items={data[activeTab.id]} labelKey={activeTab.key} loading={loading} />
            </Panel>
        </div>
    );
}

const CSS = `
.ad-panel{background:var(--ad-card); border:1px solid var(--ad-line); border-radius:22px; padding:26px; box-shadow:0 1px 0 #fff inset,0 18px 40px -26px rgba(90,26,43,.45); animation:ad-rise .6s cubic-bezier(.2,.7,.2,1) both}
.ad-gold{background:linear-gradient(135deg,#F0D58A,#D9AE4B 55%,#B08225); box-shadow:0 22px 40px -22px rgba(176,130,37,.8); animation:ad-rise .6s cubic-bezier(.2,.7,.2,1) both}
.ad-lift{transition:transform .3s,box-shadow .3s}
.ad-lift:hover{transform:translateY(-4px); box-shadow:0 26px 44px -22px rgba(90,26,43,.55)}
.ad-wave{display:inline-block; transform-origin:70% 70%; animation:ad-wave 2.2s ease-in-out 1}
@keyframes ad-wave{0%,60%,100%{transform:rotate(0)} 10%,30%{transform:rotate(14deg)} 20%,40%{transform:rotate(-8deg)} 50%{transform:rotate(10deg)}}
.ad-btn{display:inline-flex; align-items:center; gap:8px; height:42px; padding:0 18px; border-radius:12px; background:#fff; border:1px solid var(--ad-line); color:var(--ad-text); font-size:14px; font-weight:600; box-shadow:0 6px 16px -12px rgba(40,8,18,.5); transition:border-color .2s,box-shadow .2s}
.ad-btn:hover:not(:disabled){border-color:#B08225; box-shadow:0 8px 18px -10px #B08225}
.ad-btn:disabled{opacity:.6}
.ad-col{background:linear-gradient(180deg,#D9AE4B,#B08225); box-shadow:0 12px 22px -12px rgba(176,130,37,.8); transform-origin:bottom; animation:ad-col .9s cubic-bezier(.2,.7,.2,1) both}
.ad-bar{background:linear-gradient(90deg,#862A42,#B08225); transform-origin:left; animation:ad-bar .9s cubic-bezier(.2,.7,.2,1) both}
.ad-ring{animation:ad-ring 1.2s ease-out both}
.ad-seg{animation:ad-fadein .8s ease both}
@keyframes ad-rise{from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:none}}
@keyframes ad-col{from{transform:scaleY(0)} to{transform:scaleY(1)}}
@keyframes ad-bar{from{transform:scaleX(0)} to{transform:scaleX(1)}}
@keyframes ad-ring{from{stroke-dashoffset:var(--c)}}
@keyframes ad-fadein{from{opacity:0}}
@media(prefers-reduced-motion:reduce){.ad-panel,.ad-gold,.ad-col,.ad-bar,.ad-ring,.ad-seg,.ad-wave{animation:none}.ad-lift{transition:none}}
`;