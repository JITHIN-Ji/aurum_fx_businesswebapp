import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { loginAdmin } from "../api/adminLogin";

/* -------------------------------------------------------------------------- */
/*  Admin sign in  ·  route: /admin                                            */
/*  Admins are not self-registered, so there is no sign-up option here.        */
/*  Admin sign in uses the admin authentication API.                          */
/* -------------------------------------------------------------------------- */

const checkEmail = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address");

export default function AdminLogin() {
    const navigate = useNavigate();
    const [v, setV] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [show, setShow] = useState(false);
    const [caps, setCaps] = useState(false);
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const next = { email: checkEmail(v.email), password: v.password ? "" : "Password is required" };
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        setServerError("");
        setLoading(true);
        try {
            await loginAdmin({ email: v.email.trim(), password: v.password });
            navigate("/admin/dashboard", { replace: true });
        } catch (error) {
            setServerError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="afx-admin relative min-h-screen grid place-items-center px-6 py-12 overflow-hidden">
            <style>{CSS}</style>
            <div className="afx-admin-bg" aria-hidden="true" />

            <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-[var(--a-muted)] hover:text-[var(--a-text)] transition-colors">
                <ArrowLeft size={16} /> Back to website
            </Link>

            <div className="relative w-full max-w-md afx-in">
                <Link to="/" className="afx-serif text-2xl font-semibold tracking-tight block text-center mb-8">
                    Aurum <span className="text-[var(--a-gold)]">FX</span>
                </Link>

                <div className="afx-admin-card p-8 sm:p-10">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--a-gold)]/60 text-[var(--a-gold)] text-xs font-medium">
                        <ShieldCheck size={14} /> Admin access
                    </span>
                    <h1 className="afx-serif text-3xl font-semibold mt-5">Admin sign in</h1>
                    <p className="mt-2 text-[var(--a-muted)] text-sm">Use the credentials issued to you by Aurum FX.</p>

                    <form onSubmit={submit} noValidate className="mt-8 space-y-5">
                        {serverError && <p role="alert" className="flex items-start gap-2 text-sm text-[var(--a-err)]"><AlertCircle size={15} className="shrink-0 mt-0.5" />{serverError}</p>}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                            <input id="email" name="email" type="email" autoComplete="username" value={v.email} onChange={set("email")}
                                aria-invalid={!!errors.email} className={`afx-input ${errors.email ? "afx-input-err" : ""}`} />
                            {errors.email && <p className="mt-1.5 text-xs text-[var(--a-err)] flex items-center gap-1.5"><AlertCircle size={13} /> {errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                            <div className="relative">
                                <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password"
                                    value={v.password} onChange={set("password")} aria-invalid={!!errors.password}
                                    onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
                                    className={`afx-input pr-12 ${errors.password ? "afx-input-err" : ""}`} />
                                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
                                    className="absolute right-0 top-0 h-12 w-12 grid place-items-center text-[var(--a-muted)] hover:text-[var(--a-text)]">
                                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-[var(--a-err)] flex items-center gap-1.5"><AlertCircle size={13} /> {errors.password}</p>}
                            {caps && <p className="mt-1.5 text-xs text-[var(--a-gold)]">Caps Lock is on</p>}
                        </div>
                        <button type="submit" disabled={loading} className="afx-submit w-full h-12 inline-flex items-center justify-center gap-2 font-medium">
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {loading ? "Signing in" : "Sign in to admin console"}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-sm text-center text-[var(--a-muted)]">
                    Field staff? <Link to="/staff" className="text-[var(--a-gold)] font-medium hover:underline">Go to staff sign in</Link>
                </p>
            </div>
        </div>
    );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap');
.afx-admin{
  --a-bg:#14110B; --a-card:#1C1810; --a-text:#F3ECDA; --a-muted:#A89F88; --a-line:#3A3321;
  --a-gold:#D9AE4B; --a-gold-deep:#B08225; --a-err:#F2877E;
  background:var(--a-bg); color:var(--a-text); font-family:'Inter',system-ui,sans-serif;
}
.afx-serif{font-family:'Fraunces',Georgia,serif; letter-spacing:-0.01em}
.afx-admin-bg{
  position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(50% 45% at 50% 0%, rgba(217,174,75,.18), transparent 70%),
    linear-gradient(rgba(217,174,75,.05) 1px, transparent 1px) 0 0/48px 48px,
    linear-gradient(90deg, rgba(217,174,75,.05) 1px, transparent 1px) 0 0/48px 48px;
  mask-image:radial-gradient(70% 70% at 50% 40%, #000 30%, transparent 100%);
}
.afx-admin-card{
  background:var(--a-card); border:1px solid rgba(217,174,75,.45);
  outline:1px solid rgba(217,174,75,.25); outline-offset:8px; box-shadow:0 30px 60px -30px rgba(0,0,0,.8);
}
.afx-input{
  width:100%; height:48px; padding:0 14px; background:var(--a-bg); color:var(--a-text);
  border:1px solid var(--a-line); font:inherit; font-size:15px; transition:border-color .2s, box-shadow .2s;
}
.afx-input:hover{border-color:rgba(217,174,75,.5)}
.afx-input:focus{outline:none; border-color:var(--a-gold); box-shadow:0 0 0 3px rgba(217,174,75,.25)}
.afx-input-err{border-color:var(--a-err)}
.afx-submit{background:var(--a-gold); color:#14110B; transition:background .2s, transform .2s}
.afx-submit:hover:not(:disabled){background:#E3BF68; transform:translateY(-1px)}
.afx-submit:disabled{opacity:.7; cursor:not-allowed}
.afx-admin a:focus-visible,.afx-admin button:focus-visible{outline:2px solid var(--a-gold); outline-offset:3px}
@keyframes afx-in{from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:none}}
.afx-in{animation:afx-in .5s cubic-bezier(.2,.7,.2,1) both}
@media (prefers-reduced-motion:reduce){.afx-in{animation:none}}
`;