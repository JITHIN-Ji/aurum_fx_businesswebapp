import { useCallback, useEffect, useRef, useState } from "react"
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, Store, UserRound, X } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { authenticatedStaffRequest, clearStaffToken, getStaffToken } from "../api/staffAuth";
import { getUnreadMessageCount } from "../api/messages";

// Add a page: one item here + one <Route> in App.jsx
const STAFF_NAV = [
    { name: "Dashboard", to: "/staff/dashboard", icon: LayoutDashboard, title: "Dashboard", subtitle: "Your visits and records at a glance" },
    { name: "Business directory", to: "/staff/businesses", icon: Store, title: "Business directory", subtitle: "Browse and manage recorded businesses" },
    { name: "Add business", to: "/staff/businesses/new", icon: Plus, title: "Add a business", subtitle: "Create a business record" },
    { name: "Messages & enquiries", to: "/staff/messages", icon: MessageSquare, title: "Messages & enquiries", subtitle: "Contact the admin team" },
    { name: "Profile", to: "/staff/profile", icon: UserRound, title: "Profile", subtitle: "Update your staff profile" },
];

export default function StaffLayout() {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadError, setUnreadError] = useState("");
    const unreadCountRef = useRef(0);
    const acknowledgedUnreadRef = useRef(0);
    const expectedUnreadAfterReadRef = useRef(0);
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const token = getStaffToken();

    useEffect(() => setOpen(false), [pathname]);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadMessageCount(authenticatedStaffRequest);
            if (count <= expectedUnreadAfterReadRef.current) {
                acknowledgedUnreadRef.current = 0;
            }
            unreadCountRef.current = count;
            setUnreadCount(Math.max(0, count - acknowledgedUnreadRef.current));
            setUnreadError("");
        } catch (requestError) {
            setUnreadError(requestError.message);
        }
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        const acknowledgeReadConversation = (event) => {
            const count = Number(event.detail?.unreadCount) || 0;
            if (count <= 0) return;
            acknowledgedUnreadRef.current += count;
            expectedUnreadAfterReadRef.current = Math.max(0, unreadCountRef.current - acknowledgedUnreadRef.current);
            setUnreadCount((current) => Math.max(0, current - count));
            setUnreadError("");
        };
        window.addEventListener("messages:unread-count-refresh", refreshUnreadCount);
        window.addEventListener("messages:staff-conversation-read", acknowledgeReadConversation);
        window.addEventListener("focus", refreshUnreadCount);
        return () => {
            window.removeEventListener("messages:unread-count-refresh", refreshUnreadCount);
            window.removeEventListener("messages:staff-conversation-read", acknowledgeReadConversation);
            window.removeEventListener("focus", refreshUnreadCount);
        };
    }, [refreshUnreadCount]);

    const current = STAFF_NAV.find((item) => pathname === item.to)
        || (pathname.startsWith("/staff/businesses/")
            ? pathname.endsWith("/edit")
                ? { title: "Edit business", subtitle: "Update a business record" }
                : { title: "Business details", subtitle: "Review a business record" }
            : { title: "Field staff", subtitle: "" });
    const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

    useEffect(() => {
        const handleUnauthorized = () => navigate("/staff", { replace: true });
        window.addEventListener("staff:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("staff:unauthorized", handleUnauthorized);
    }, [navigate]);

    const signOut = () => { clearStaffToken(); navigate("/staff", { replace: true }); };

    if (!token) return <Navigate to="/staff" replace />;

    return (
        <div className="afx-dash min-h-screen">
            <style>{CSS}</style>

            <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col afx-side text-[#F3ECDA] border-r border-[#B08225]/30 transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#F3ECDA]/10">
                    <Link to="/" className="inline-flex items-center gap-2 whitespace-nowrap afx-serif text-2xl font-semibold tracking-tight">
                        <img src="/logo.png" alt="" className="size-10 object-contain" />
                        Aurum<span className="-ml-[0.16em] afx-shine">FX</span>
                    </Link>
                    <button onClick={() => setOpen(false)} aria-label="Close menu" className="lg:hidden text-[#F3ECDA]/70 hover:text-white"><X size={22} /></button>
                </div>

                <nav className="flex-1 px-3 py-6" aria-label="Staff navigation">
                    <p className="px-3 mb-3 text-xs text-[#F3ECDA]/45">Menu</p>
                    <ul className="space-y-1">
                        {STAFF_NAV.map((item) => (
                            <li key={item.to}>
                                <NavLink to={item.to} end={item.to === "/staff/businesses"}
                                    aria-label={item.name === "Messages & enquiries"
                                        ? unreadError ? `Messages and enquiries, unread count unavailable: ${unreadError}` : `Messages and enquiries, ${unreadCount} unread`
                                        : undefined}
                                    className={({ isActive }) => `afx-nav relative flex items-center gap-3 px-3 h-11 text-sm font-medium ${isActive ? "bg-[#D9AE4B]/15 text-[#E3BF68]" : "text-[#F3ECDA]/75 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                                    {({ isActive }) => (<>
                                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#D9AE4B]" />}
                                        <item.icon size={18} strokeWidth={1.7} /> {item.name}
                                        {item.to === "/staff/messages" && (unreadCount > 0 || unreadError) && (
                                            <span title={unreadError || `${unreadCount} unread messages`}
                                                className={`ml-auto grid min-w-5 h-5 place-items-center rounded-full px-1 text-[10px] font-bold ${unreadError ? "bg-red-500/20 text-red-200" : "bg-[#D9AE4B] text-[#14110B]"}`}>
                                                {unreadError ? "!" : unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                    </>)}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-[#F3ECDA]/10">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <span className="size-10 grid place-items-center bg-[#D9AE4B] text-[#14110B] text-sm font-semibold">FS</span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">Field staff</p>
                            <p className="text-xs text-[#F3ECDA]/55">Signed in</p>
                        </div>
                    </div>
                    <button onClick={signOut} className="w-full flex items-center gap-3 px-3 h-10 text-sm text-[#F3ECDA]/75 hover:bg-white/5 hover:text-white transition-colors">
                        <LogOut size={17} strokeWidth={1.7} /> Sign out
                    </button>
                </div>
            </aside>

            {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

            <div className="lg:pl-64 min-h-screen flex flex-col min-w-0">
                <header className="sticky top-0 z-20 h-[72px] px-5 md:px-8 flex items-center justify-between gap-4 backdrop-blur-md bg-[var(--d-bg)]/85 border-b border-[var(--d-line)]">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => setOpen(true)} aria-label="Open menu" className="lg:hidden grid place-items-center size-10 -ml-2"><Menu size={22} /></button>
                        <div className="min-w-0">
                            <h1 className="afx-serif text-2xl md:text-[28px] font-semibold leading-tight truncate">{current.title}</h1>
                            {current.subtitle && <p className="hidden sm:block text-sm text-[var(--d-muted)] truncate">{current.subtitle}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden md:inline-flex items-center gap-2 h-10 px-3.5 text-sm text-[var(--d-muted)] border border-[var(--d-line)] bg-[var(--d-card)]">
                            <CalendarDays size={16} className="text-[var(--d-gold)]" /> {today}
                        </span>
                        <button aria-label="Notifications" className="relative grid place-items-center size-10 border border-[var(--d-line)] bg-[var(--d-card)] hover:border-[var(--d-gold)] transition-colors">
                            <Bell size={18} strokeWidth={1.7} />
                            <span className="afx-pulse absolute top-2 right-2 size-2 rounded-full bg-[var(--d-gold)]" />
                        </button>
                        <ThemeToggle />
                        <span className="hidden sm:grid place-items-center size-10 bg-[var(--d-gold)] text-white dark:text-[#14110B] text-sm font-semibold" title="Field staff">FS</span>
                    </div>
                </header>
                <main className="flex-1 px-5 md:px-8 py-8"><div key={pathname} className="afx-page"><Outlet /></div></main>
            </div>
        </div>
    );
}

/* Shared premium styles. Pages reuse: afx-card, afx-input, afx-btn, afx-btn-ghost, afx-btn-danger, afx-table, afx-lift */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap');
.afx-dash{
  --d-bg:#F4EFE2; --d-card:#FFFCF4; --d-text:#1B1710; --d-muted:#6B6350; --d-line:#E2D8BC;
  --d-gold:#B08225; --d-gold-deep:#8A6420; --d-err:#B3261E; --d-glow:rgba(176,130,37,.16);
  background:radial-gradient(900px 400px at 85% -5%,var(--d-glow),transparent 60%),var(--d-bg);
  color:var(--d-text); font-family:'Inter',system-ui,sans-serif;
}
.dark .afx-dash{
  --d-bg:#0F0D08; --d-card:#1A160E; --d-text:#F3ECDA; --d-muted:#A89F88; --d-line:#38311F;
  --d-gold:#D9AE4B; --d-gold-deep:#E3BF68; --d-err:#F2877E; --d-glow:rgba(217,174,75,.10);
}
.afx-serif{font-family:'Fraunces',Georgia,serif; letter-spacing:-0.01em}
.afx-side{background:linear-gradient(180deg,#221C12,#17130C)}
.afx-shine{background:linear-gradient(90deg,#D9AE4B,#F3DC9A,#D9AE4B); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; animation:afx-shine 4s linear infinite}
.afx-nav{transition:all .25s ease}
.afx-card{background:var(--d-card); border:1px solid var(--d-line); box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 10px 30px -18px rgba(60,40,5,.35); transition:border-color .25s,box-shadow .25s,transform .25s}
.afx-lift:hover{border-color:var(--d-gold); transform:translateY(-3px); box-shadow:0 18px 36px -18px rgba(176,130,37,.5)}
.afx-input{width:100%; height:48px; padding:0 14px; border:1px solid var(--d-line); background:var(--d-bg); color:var(--d-text); transition:border-color .2s,box-shadow .2s}
textarea.afx-input{height:auto; padding:12px 14px}
.afx-input:hover{border-color:var(--d-gold)}
.afx-input:focus{outline:none; border-color:var(--d-gold); box-shadow:0 0 0 4px var(--d-glow)}
.afx-btn,.afx-btn-ghost,.afx-btn-danger{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:44px; padding:0 20px; font-size:14px; font-weight:500; position:relative; overflow:hidden; transition:transform .2s,box-shadow .2s,background .2s,border-color .2s}
.afx-btn{background:linear-gradient(135deg,var(--d-gold),var(--d-gold-deep)); color:#fff}
.dark .afx-btn{color:#14110B}
.afx-btn:hover:not(:disabled){transform:translateY(-1px); box-shadow:0 10px 22px -10px var(--d-gold)}
.afx-btn:active:not(:disabled){transform:translateY(0)}
.afx-btn-ghost{border:1px solid var(--d-line); background:var(--d-card)}
.afx-btn-ghost:hover{border-color:var(--d-gold)}
.afx-btn-danger{background:color-mix(in srgb,var(--d-err) 12%,transparent); color:var(--d-err)}
.afx-btn-danger:hover:not(:disabled){background:var(--d-err); color:#fff}
.afx-btn:disabled,.afx-btn-ghost:disabled,.afx-btn-danger:disabled{opacity:.6; cursor:not-allowed}
.afx-table th{padding:14px 20px; font-weight:600; font-size:12px; text-align:left; color:var(--d-muted); background:var(--d-bg); border-bottom:1px solid var(--d-line); white-space:nowrap}
.afx-table td{padding:16px 20px; border-bottom:1px solid var(--d-line)}
.afx-table tbody tr{transition:background .2s,box-shadow .2s}
.afx-table tbody tr:hover{background:var(--d-glow); box-shadow:inset 3px 0 0 var(--d-gold)}
.afx-table tbody tr:last-child td{border-bottom:0}
.afx-chip{display:inline-block; padding:3px 10px; font-size:12px; font-weight:500; color:var(--d-gold-deep); background:var(--d-glow); border:1px solid color-mix(in srgb,var(--d-gold) 35%,transparent)}
.afx-avatar{display:grid; place-items:center; width:40px; height:40px; flex:none; font-weight:600; background:linear-gradient(135deg,var(--d-gold),var(--d-gold-deep)); color:#fff}
.dark .afx-avatar{color:#14110B}
.afx-dash a:focus-visible,.afx-dash button:focus-visible{outline:2px solid var(--d-gold); outline-offset:2px}
@keyframes afx-rise{from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:none}}
@keyframes afx-bar{from{transform:scaleY(0)} to{transform:scaleY(1)}}
@keyframes afx-fill{from{transform:scaleX(0)} to{transform:scaleX(1)}}
@keyframes afx-draw{from{stroke-dashoffset:var(--len)} to{stroke-dashoffset:0}}
@keyframes afx-fade{from{opacity:0} to{opacity:1}}
@keyframes afx-shine{to{background-position:200% 0}}
@keyframes afx-ping{0%{box-shadow:0 0 0 0 var(--d-gold)} 70%,100%{box-shadow:0 0 0 7px transparent}}
.afx-rise{opacity:0; animation:afx-rise .6s cubic-bezier(.2,.7,.2,1) forwards}
.afx-page{animation:afx-rise .5s cubic-bezier(.2,.7,.2,1) both}
.afx-bar{transform-origin:bottom; animation:afx-bar .8s cubic-bezier(.2,.7,.2,1) both}
.afx-fill{transform-origin:left; animation:afx-fill .9s cubic-bezier(.2,.7,.2,1) both}
.afx-draw{stroke-dasharray:var(--len); animation:afx-draw 1.4s ease-out both}
.afx-fade{animation:afx-fade 1.2s ease .5s both}
.afx-pulse{animation:afx-ping 2s infinite}
@media (prefers-reduced-motion:reduce){.afx-rise,.afx-page,.afx-bar,.afx-fill,.afx-draw,.afx-fade,.afx-pulse,.afx-shine{animation:none; opacity:1; transform:none; stroke-dasharray:none}}
`;