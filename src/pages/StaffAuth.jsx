import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginStaff } from "../api/staffAuth";

/* -------------------------------------------------------------------------- */
/*  Field staff sign in  ·  route: /staff                                     */
/* -------------------------------------------------------------------------- */

const u = (id, w = 1400) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;
// Wide, bright city skylines (New York, Singapore, Dubai, London)
const PANEL_IMAGES = [
    "photo-1578771607806-a34b27022297", // New York, golden hour
    "photo-1636378550252-865da7820f1c", // Singapore, Marina Bay
    "photo-1691814499176-f5d431058ebf", // New York, from Empire State Building
    "photo-1621073831231-faa453d28112", // Dubai, Business Bay
    "photo-1773665231158-d80e8a86f44d", // London, financial district
    "photo-1768463852068-cc277b8baf35", // Dubai, Marina
];
// PLACEHOLDER numbers, same as the landing page
const PANEL_STATS = [["700+", "Districts"], ["1,200+", "Field staff"], ["5 lakh+", "Businesses"]];

const check = {
    required: (v, label) => (String(v).trim() ? "" : `${label} is required`),
};

/* --------------------------------- page ----------------------------------- */

export default function StaffAuth() {
    const [i, setI] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setI((x) => (x + 1) % PANEL_IMAGES.length), 5000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="afx-auth min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
            <style>{CSS}</style>

            {/* Brand panel */}
            <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1B1710] text-[#F3ECDA] p-12">
                {PANEL_IMAGES.map((id, idx) => (
                    <img key={id} src={u(id)} alt="" aria-hidden="true" loading={idx === 0 ? "eager" : "lazy"}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                        className={`absolute inset-0 w-full h-full object-cover afx-kb transition-opacity duration-[1600ms] ${idx === i ? "opacity-100" : "opacity-0"}`} />
                ))}
                {/* light overlays: only enough shade for the logo and text to stay readable */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#1B1710]/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#1B1710]/90 via-[#1B1710]/45 to-transparent" />
                <div className="absolute inset-6 border border-[#B08225]/60 pointer-events-none" />

                <Link to="/" className="relative inline-flex w-fit items-center gap-2 whitespace-nowrap afx-serif text-2xl font-semibold tracking-tight">
                    <img src="/logo.png" alt="" className="size-10 object-contain" />
                    Aurum<span className="-ml-[0.16em] text-[#D9AE4B]">FX</span>
                </Link>

                <div className="relative">
                    <p className="text-sm text-[#D9AE4B] font-medium">Field staff portal</p>
                    <h2 className="afx-serif text-4xl xl:text-5xl font-semibold leading-tight mt-3 max-w-md">
                        Part of a business network that keeps growing.
                    </h2>
                    <p className="mt-4 text-[#F3ECDA]/75 leading-relaxed max-w-md">
                        Sign in to add and update the businesses you visit.
                    </p>
                    <dl className="mt-10 pt-6 border-t border-[#B08225]/40 grid grid-cols-3 gap-6 max-w-md">
                        {PANEL_STATS.map(([v, k]) => (
                            <div key={k}>
                                <dd className="afx-serif text-2xl font-semibold text-[#D9AE4B]">{v}</dd>
                                <dt className="text-xs text-[#F3ECDA]/70 mt-1">{k}</dt>
                            </div>
                        ))}
                    </dl>
                </div>
            </aside>

            {/* Form side */}
            <main className="flex flex-col px-6 sm:px-10 lg:px-16 py-8">
                <div className="flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--a-muted)] hover:text-[var(--a-text)] transition-colors">
                        <ArrowLeft size={16} /> Back to website
                    </Link>
                    <Link to="/" className="inline-flex items-center whitespace-nowrap afx-serif text-xl font-semibold lg:hidden">Aurum<span className="ml-[0.04em] text-[var(--a-gold)]">FX</span></Link>
                    <Link to="/admin" className="hidden lg:block text-sm text-[var(--a-muted)] hover:text-[var(--a-text)] transition-colors">Admin sign in</Link>
                </div>

                <div className="flex-1 flex items-center">
                    <div className="w-full max-w-md mx-auto py-10">
                        <div className="afx-in">
                            <h1 className="afx-serif text-3xl md:text-4xl font-semibold">Welcome back</h1>
                            <p className="mt-2 text-[var(--a-muted)]">Sign in to the field staff dashboard.</p>
                        </div>
                        <LoginForm />
                    </div>
                </div>

                <p className="text-xs text-[var(--a-muted)] text-center">© {new Date().getFullYear()} AurumFX. All rights reserved.</p>
            </main>
        </div>
    );
}

/* -------------------------------- sign in --------------------------------- */

function LoginForm() {
    const navigate = useNavigate();
    const [v, setV] = useState({ identifier: "", password: "", remember: false });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const next = { identifier: check.required(v.identifier, "Staff ID"), password: check.required(v.password, "Password") };
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        setServerError("");
        setLoading(true);
        try {
            await loginStaff({ staffId: v.identifier.trim(), password: v.password, remember: v.remember });
            navigate("/staff/dashboard", { replace: true });
        } catch (error) {
            setServerError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            <TextField id="identifier" label="Staff ID" autoComplete="username"
                value={v.identifier} onChange={set("identifier")} error={errors.identifier} placeholder="Enter your staff ID" />
            <PasswordField id="password" label="Password" autoComplete="current-password"
                value={v.password} onChange={set("password")} error={errors.password} />
            {serverError && <p role="alert" className="text-sm text-[var(--a-err)] flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" />{serverError}</p>}
            <div className="flex items-center justify-between">
                <CheckField id="remember" checked={v.remember} onChange={set("remember")}>Keep me signed in</CheckField>
                <button type="button" className="text-sm text-[var(--a-gold-deep)] hover:underline">Forgot password?</button>
            </div>
            <SubmitButton loading={loading}>{loading ? "Signing in" : "Sign in"}</SubmitButton>
        </form>
    );
}

/* ------------------------------ form controls ----------------------------- */

function Message({ id, error, hint }) {
    if (error) return <p id={`${id}-msg`} className="mt-1.5 text-xs text-[var(--a-err)] flex items-center gap-1.5"><AlertCircle size={13} /> {error}</p>;
    if (hint) return <p id={`${id}-msg`} className="mt-1.5 text-xs text-[var(--a-muted)]">{hint}</p>;
    return null;
}

function TextField({ id, label, error, hint, ...props }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
            <input id={id} name={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-msg` : undefined}
                className={`afx-input ${error ? "afx-input-err" : ""}`} {...props} />
            <Message id={id} error={error} hint={hint} />
        </div>
    );
}

function PasswordField({ id, label, error, hint, ...props }) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
            <div className="relative">
                <input id={id} name={id} type={show ? "text" : "password"} aria-invalid={!!error}
                    aria-describedby={error || hint ? `${id}-msg` : undefined} className={`afx-input pr-12 ${error ? "afx-input-err" : ""}`} {...props} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-0 top-0 h-12 w-12 grid place-items-center text-[var(--a-muted)] hover:text-[var(--a-text)]">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            <Message id={id} error={error} hint={hint} />
        </div>
    );
}

function CheckField({ id, error, children, ...props }) {
    return (
        <div>
            <label htmlFor={id} className="flex items-start gap-3 text-sm cursor-pointer">
                <input id={id} name={id} type="checkbox" className="afx-check mt-0.5" {...props} />
                <span>{children}</span>
            </label>
            {error && <p className="mt-1.5 text-xs text-[var(--a-err)]">{error}</p>}
        </div>
    );
}

function SubmitButton({ loading, children }) {
    return (
        <button type="submit" disabled={loading} className="afx-submit w-full h-12 inline-flex items-center justify-center gap-2 font-medium">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {children}
        </button>
    );
}

/* --------------------------------- styles --------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap');
.afx-auth{
  --a-bg:#FAF6EC; --a-surface:#F2EBD8; --a-text:#1B1710; --a-muted:#6B6350; --a-line:#DDD2B4;
  --a-gold:#B08225; --a-gold-deep:#8A6420; --a-err:#B3261E;
  background:var(--a-bg); color:var(--a-text); font-family:'Inter',system-ui,sans-serif;
}
.dark .afx-auth{
  --a-bg:#14110B; --a-surface:#1C1810; --a-text:#F3ECDA; --a-muted:#A89F88; --a-line:#3A3321;
  --a-gold:#D9AE4B; --a-gold-deep:#E3BF68; --a-err:#F2877E;
}
.afx-serif{font-family:'Fraunces',Georgia,serif; letter-spacing:-0.01em}
.afx-input{
  width:100%; height:48px; padding:0 14px; background:var(--a-bg); color:var(--a-text);
  border:1px solid var(--a-line); font:inherit; font-size:15px; transition:border-color .2s, box-shadow .2s;
}
.afx-input::placeholder{color:var(--a-muted); opacity:.7}
.afx-input:hover{border-color:color-mix(in srgb, var(--a-gold) 55%, var(--a-line))}
.afx-input:focus{outline:none; border-color:var(--a-gold); box-shadow:0 0 0 3px color-mix(in srgb, var(--a-gold) 25%, transparent)}
.afx-input-err{border-color:var(--a-err)}
.afx-check{width:18px; height:18px; accent-color:var(--a-gold); flex-shrink:0}
.afx-submit{background:var(--a-gold); color:#fff; transition:background .2s, transform .2s}
.afx-submit:hover:not(:disabled){background:var(--a-gold-deep); transform:translateY(-1px)}
.afx-submit:disabled{opacity:.7; cursor:not-allowed}
.dark .afx-submit{color:#14110B}
.afx-auth a:focus-visible,.afx-auth button:focus-visible{outline:2px solid var(--a-gold); outline-offset:3px}
@keyframes afx-in{from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:none}}
@keyframes afx-kb{from{transform:scale(1)} to{transform:scale(1.08)}}
.afx-in{animation:afx-in .5s cubic-bezier(.2,.7,.2,1) both}
.afx-kb{animation:afx-kb 9s ease-out forwards}
@media (prefers-reduced-motion:reduce){.afx-in,.afx-kb{animation:none}}
`;