import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, Crown, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, ShieldCheck, UserPlus, UserRound, Users, X } from "lucide-react";
import { authenticatedAdminRequest, clearAdminSession, getAdminData, getAdminToken } from "../api/adminLogin";
import { getUnreadMessageCount } from "../api/messages";

const ADMIN_NAV = [
    { name: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, subtitle: "Organization overview and business activity" },
    { name: "Staff", to: "/admin/staff", icon: Users, subtitle: "Manage staff accounts" },
    { name: "Staff registration", to: "/admin/staff/register", icon: UserPlus, subtitle: "Create a staff account" },
    { name: "Business", to: "/admin/businesses", icon: Building2, subtitle: "Business directory and records" },
    { name: "Add business", to: "/admin/businesses/new", icon: Plus, subtitle: "Create a business record" },
    { name: "Messages", to: "/admin/messages", icon: MessageSquare, subtitle: "Field staff messages and enquiries" },
    { name: "Admin profile", to: "/admin/profile", icon: UserRound, subtitle: "Update admin email or password" },
];

// Business stays active on details/edit pages, but not on the "new" page
const isNavActive = (item, pathname) => {
    if (item.to === "/admin/businesses") return pathname.startsWith("/admin/businesses") && pathname !== "/admin/businesses/new";
    if (item.to === "/admin/businesses/new") return pathname === item.to;
    if (item.to === "/admin/staff") return pathname === item.to || (pathname.startsWith(`${item.to}/`) && pathname !== "/admin/staff/register");
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

export default function AdminLayout() {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadError, setUnreadError] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const admin = getAdminData();

    useEffect(() => setOpen(false), [location.pathname]);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadMessageCount(authenticatedAdminRequest);
            setUnreadCount(count);
            setUnreadError("");
        } catch (requestError) {
            setUnreadError(requestError.message);
        }
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        window.addEventListener("messages:unread-count-refresh", refreshUnreadCount);
        window.addEventListener("focus", refreshUnreadCount);
        return () => {
            window.removeEventListener("messages:unread-count-refresh", refreshUnreadCount);
            window.removeEventListener("focus", refreshUnreadCount);
        };
    }, [refreshUnreadCount]);

    const signOut = () => {
        clearAdminSession();
        navigate("/admin", { replace: true });
    };

    if (!getAdminToken()) return <Navigate to="/admin" replace />;

    const initials = (admin?.name || "Admin").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const current = ADMIN_NAV.find((item) => location.pathname === item.to)
        || ADMIN_NAV.find((item) => isNavActive(item, location.pathname))
        || { name: "Admin", subtitle: "Administration" };
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div className="ad-shell min-h-screen">
            <style>{CSS}</style>

            <aside className={`ad-side fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col text-[#EFE8D4] transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-[76px] items-center justify-between px-6">
                    <Link to="/admin/dashboard" className="flex items-center gap-3">
                        <span className="ad-crest grid size-10 place-items-center rounded-xl text-[#2B0B14]"><Crown size={20} strokeWidth={2} /></span>
                        <span className="ad-display text-xl font-bold leading-none">Aurum FX<span className="mt-1 block text-[10px] font-medium tracking-[0.2em] text-[#D9AE4B]">ADMIN</span></span>
                    </Link>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="lg:hidden text-white/70 hover:text-white"><X size={22} /></button>
                </div>

                <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[#D9AE4B]/50 to-transparent" />

                <nav className="flex-1 px-4 py-6" aria-label="Admin navigation">
                    <p className="mb-3 px-3 text-xs font-semibold text-white/40">Administration</p>
                    <ul className="space-y-1.5">
                        {ADMIN_NAV.map((item) => (
                            <li key={item.to}>
                                <NavLink to={item.to} aria-label={item.name === "Messages"
                                    ? unreadError ? `Messages, unread count unavailable: ${unreadError}` : `Messages, ${unreadCount} unread`
                                    : undefined}
                                    className={`ad-nav ${isNavActive(item, location.pathname) ? "ad-nav-on" : ""}`}>
                                    <item.icon size={18} strokeWidth={1.8} /> {item.name}
                                    {item.to === "/admin/messages" && (unreadCount > 0 || unreadError) && (
                                        <span title={unreadError || `${unreadCount} unread messages`}
                                            className={`ml-auto grid min-w-5 h-5 place-items-center rounded-full px-1 text-[10px] font-bold ${unreadError ? "bg-red-500/20 text-red-200" : "bg-[#D9AE4B] text-[#2B0B14]"}`}>
                                            {unreadError ? "!" : unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="m-4 rounded-2xl border border-[#D9AE4B]/25 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                        <span className="ad-crest grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-[#2B0B14]">{initials}</span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{admin?.name || "Administrator"}</p>
                            <p className="truncate text-xs text-white/55">{admin?.role || admin?.email || "Admin account"}</p>
                        </div>
                    </div>
                    <button type="button" onClick={signOut} className="mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-medium text-white/80 transition hover:border-[#D9AE4B] hover:bg-[#D9AE4B]/10 hover:text-white">
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </aside>

            {open && <button type="button" aria-label="Close admin menu" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

            <div className="relative min-h-screen min-w-0 lg:pl-[270px]">
                <div className="ad-banner" aria-hidden="true" />

                <header className="relative z-20 flex h-[84px] items-center justify-between gap-4 px-5 md:px-10">
                    <div className="flex min-w-0 items-center gap-3 text-white">
                        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="-ml-2 grid size-10 place-items-center lg:hidden"><Menu size={22} /></button>
                        <div className="min-w-0">
                            <p className="truncate text-sm text-[#E8D9A8]">{greeting}{admin?.name ? `, ${admin.name}` : ""}</p>
                            <h1 className="ad-display truncate text-2xl font-bold leading-tight md:text-[28px]">{current.name}</h1>
                        </div>
                    </div>
                    <div className="hidden shrink-0 items-center gap-3 md:flex">
                        <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[13px] text-white/90 backdrop-blur-sm">{today}</span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#D9AE4B]/50 bg-[#D9AE4B]/15 px-3.5 py-1.5 text-[13px] font-medium text-[#F0D58A]">
                            <ShieldCheck size={15} /> Secure session
                        </span>
                    </div>
                </header>

                <main className="relative z-10 px-5 pb-12 pt-6 md:px-10"><div key={location.pathname} className="ad-page"><Outlet /></div></main>
            </div>
        </div>
    );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ad-shell{
  --ad-bg:#F6F4F1; --ad-card:#FFFFFF; --ad-text:#2A1A1F; --ad-muted:#80707A; --ad-line:#E6DFC9;
  --ad-gold:#B08225; --ad-gold2:#D9AE4B; --ad-green:#5A1A2B; --ad-green2:#862A42;
  background:var(--ad-bg); color:var(--ad-text); font-family:'Plus Jakarta Sans',system-ui,sans-serif;
}
.ad-display{font-family:'Playfair Display',Georgia,serif; letter-spacing:-.01em}
.ad-side{background:radial-gradient(420px 260px at 0% 0%,rgba(217,174,75,.18),transparent 70%),linear-gradient(190deg,#6B2034,#3A0F1B); box-shadow:8px 0 40px -20px rgba(40,8,18,.6)}
.ad-crest{background:linear-gradient(135deg,#F0D58A,#D9AE4B 55%,#B08225)}
.ad-banner{position:absolute; inset:0 0 auto 0; height:84px; background:radial-gradient(520px 300px at 85% 0%,rgba(217,174,75,.35),transparent 70%),radial-gradient(400px 260px at 10% 100%,rgba(255,255,255,.07),transparent 70%),linear-gradient(120deg,#5A1A2B,#862A42 70%,#A33B56)}
.ad-banner::after{content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px); background-size:44px 44px; mask-image:linear-gradient(180deg,#000,transparent)}
.ad-nav{display:flex; align-items:center; gap:12px; height:46px; padding:0 14px; border-radius:12px; font-size:14px; font-weight:600; color:rgba(239,232,212,.75); border:1px solid transparent; transition:all .25s}
.ad-nav:hover{background:rgba(255,255,255,.06); color:#fff; transform:translateX(3px)}
.ad-nav-on,.ad-nav-on:hover{background:linear-gradient(90deg,rgba(217,174,75,.25),rgba(217,174,75,.06)); border-color:rgba(217,174,75,.4); color:#F0D58A; transform:none}
.ad-page{animation:ad-fade .5s ease-out both}
@keyframes ad-fade{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none}}
.ad-shell a:focus-visible,.ad-shell button:focus-visible{outline:2px solid var(--ad-gold2); outline-offset:2px}
@media(prefers-reduced-motion:reduce){.ad-page{animation:none}}
`;