import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import {
    loginAdmin,
    requestAdminPasswordReset,
    resetAdminPassword,
    verifyAdminPasswordReset,
} from "../api/adminLogin";

/* -------------------------------------------------------------------------- */
/*  Admin sign in  ·  route: /admin                                            */
/*  Admins are not self-registered, so there is no sign-up option here.        */
/*  Admin sign in uses the admin authentication API.                          */
/* -------------------------------------------------------------------------- */

const checkEmail = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address");
const resetRequestIdFrom = (data) => typeof data === "string"
    ? data.trim()
    : data?.reset_request_id || data?.data?.reset_request_id || "";
const resetTokenFrom = (data) => typeof data === "string"
    ? data.trim()
    : data?.reset_token || data?.token || data?.data?.reset_token || data?.data?.token || "";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [v, setV] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [show, setShow] = useState(false);
    const [caps, setCaps] = useState(false);
    const [recoveryStep, setRecoveryStep] = useState("");
    const [resetRequestId, setResetRequestId] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [recoveryError, setRecoveryError] = useState("");
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [loginNotice, setLoginNotice] = useState("");
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

    const beginPasswordReset = async () => {
        setRecoveryStep("starting");
        setRecoveryError("");
        setRecoveryLoading(true);
        try {
            const result = await requestAdminPasswordReset();
            const requestId = resetRequestIdFrom(result);
            if (!requestId) {
                throw new Error("The password reset response did not include a reset request ID.");
            }
            setResetRequestId(requestId);
            setRecoveryStep("otp");
        } catch (error) {
            setRecoveryError(error.message);
        } finally {
            setRecoveryLoading(false);
        }
    };

    const verifyOtp = async (event) => {
        event.preventDefault();
        setRecoveryError("");
        if (!otp.trim()) {
            setRecoveryError("Enter the verification code.");
            return;
        }
        setRecoveryLoading(true);
        try {
            const result = await verifyAdminPasswordReset({ otp: otp.trim(), resetRequestId });
            const token = resetTokenFrom(result);
            if (!token) {
                throw new Error("The OTP verification response did not include a password reset token.");
            }
            setResetToken(token);
            setRecoveryStep("password");
        } catch (error) {
            setRecoveryError(error.message);
        } finally {
            setRecoveryLoading(false);
        }
    };

    const submitNewPassword = async (event) => {
        event.preventDefault();
        setRecoveryError("");
        if (!newPassword) {
            setRecoveryError("Enter a new password.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setRecoveryError("The passwords do not match.");
            return;
        }
        setRecoveryLoading(true);
        try {
            await resetAdminPassword({ resetToken, newPassword, confirmPassword });
            closeRecovery();
            setV((current) => ({ ...current, password: "" }));
            setErrors({});
            setServerError("");
            setLoginNotice("Password reset successful. Sign in with your new password.");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setRecoveryError(error.message);
        } finally {
            setRecoveryLoading(false);
        }
    };

    const closeRecovery = () => {
        setRecoveryStep("");
        setResetRequestId("");
        setResetToken("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setRecoveryError("");
    };

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

                {recoveryStep ? (
                    <div className="afx-admin-card p-8 sm:p-10" aria-live="polite">
                        <h1 className="afx-serif text-3xl font-semibold">
                            {recoveryStep === "starting" ? "Forgot password?" : recoveryStep === "otp" ? "Verify reset code" : "Choose a new password"}
                        </h1>
                        <p className="mt-2 text-sm text-[var(--a-muted)]">
                            {recoveryStep === "starting"
                                ? "Request a code to reset your admin password."
                                : recoveryStep === "otp"
                                    ? "Enter the code sent for your admin password reset."
                                    : "Enter and confirm your new password."}
                        </p>

                        {recoveryStep === "starting" && (
                            <div className="mt-6 space-y-4">
                                {recoveryError && <p role="alert" className="text-sm text-[var(--a-err)]">{recoveryError}</p>}
                                {recoveryLoading ? (
                                    <p className="flex items-center gap-2 text-sm text-[var(--a-muted)]"><Loader2 size={17} className="animate-spin" /> Sending reset code…</p>
                                ) : (
                                    <button type="button" onClick={beginPasswordReset} className="afx-submit h-11 w-full font-medium">
                                        Send reset code
                                    </button>
                                )}
                            </div>
                        )}

                        {recoveryStep === "otp" && (
                            <form onSubmit={verifyOtp} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="reset-otp" className="mb-1.5 block text-sm font-medium">Verification code</label>
                                    <input id="reset-otp" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)}
                                        className="afx-input" required />
                                </div>
                                {recoveryError && <p role="alert" className="text-sm text-[var(--a-err)]">{recoveryError}</p>}
                                <button type="submit" disabled={recoveryLoading} className="afx-submit h-11 w-full inline-flex items-center justify-center gap-2 font-medium">
                                    {recoveryLoading && <Loader2 size={17} className="animate-spin" />}
                                    {recoveryLoading ? "Verifying code…" : "Verify code"}
                                </button>
                            </form>
                        )}

                        {recoveryStep === "password" && (
                            <form onSubmit={submitNewPassword} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium">New password</label>
                                    <input id="new-password" type="password" autoComplete="new-password" value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)} className="afx-input" required />
                                </div>
                                <div>
                                    <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">Confirm new password</label>
                                    <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)} className="afx-input" required />
                                </div>
                                {recoveryError && <p role="alert" className="text-sm text-[var(--a-err)]">{recoveryError}</p>}
                                <button type="submit" disabled={recoveryLoading} className="afx-submit h-11 w-full inline-flex items-center justify-center gap-2 font-medium">
                                    {recoveryLoading && <Loader2 size={17} className="animate-spin" />}
                                    {recoveryLoading ? "Updating password…" : "Reset password"}
                                </button>
                            </form>
                        )}

                        <button type="button" onClick={closeRecovery} className="mt-5 text-sm text-[var(--a-muted)] hover:underline">
                            Return to admin sign in
                        </button>
                    </div>
                ) : (
                <div className="afx-admin-card p-8 sm:p-10">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--a-gold)]/60 text-[var(--a-gold)] text-xs font-medium">
                        <ShieldCheck size={14} /> Admin access
                    </span>
                    <h1 className="afx-serif text-3xl font-semibold mt-5">Admin sign in</h1>
                    <p className="mt-2 text-[var(--a-muted)] text-sm">Use the credentials issued to you by Aurum FX.</p>

                    <form onSubmit={submit} noValidate className="mt-8 space-y-5">
                        {loginNotice && <p role="status" className="text-sm text-emerald-400">{loginNotice}</p>}
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
                                    {show ? <Eye size={18} /> : <EyeOff size={18} />}
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
                    <div className="mt-4 text-right">
                        <button type="button" onClick={beginPasswordReset} disabled={recoveryLoading || recoveryStep !== ""}
                            className="text-sm font-medium text-[var(--a-gold)] hover:underline disabled:opacity-60">
                            Forgot password?
                        </button>
                    </div>
                </div>
                )}

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
.afx-input::-ms-reveal,.afx-input::-ms-clear{display:none}
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