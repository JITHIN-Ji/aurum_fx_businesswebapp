import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CustomerBusinessExplorer from "../components/CustomerBusinessExplorer";

export default function BrowseDistricts() {
    return (
        <main className="afx min-h-screen pb-20 md:pb-28">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap');

                /* ---------- tokens (same palette) ---------- */
                .afx{--afx-bg:#FAF6EC;--afx-surface:#F2EBD8;--afx-ink:#1B1710;--afx-text:#1B1710;--afx-muted:#6B6350;--afx-line:#DDD2B4;--afx-gold:#B08225;--afx-gold-deep:#8A6420;--afx-gold-soft:rgba(176,130,37,.14);--afx-shadow:0 1px 2px rgba(27,23,16,.05),0 12px 32px -12px rgba(80,60,20,.22);background:var(--afx-bg);color:var(--afx-text);font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
                .dark .afx{--afx-bg:#17140E;--afx-surface:#221D12;--afx-ink:#F3ECDA;--afx-text:#F3ECDA;--afx-muted:#B2A88E;--afx-line:#403722;--afx-gold:#D9AE4B;--afx-gold-deep:#E3BF68;--afx-gold-soft:rgba(217,174,75,.16);--afx-shadow:0 1px 2px rgba(0,0,0,.4),0 16px 36px -14px rgba(0,0,0,.6)}
                .afx-serif{font-family:Fraunces,Georgia,serif;letter-spacing:-.015em}

                /* ---------- buttons ---------- */
                .afx-btn-gold{background:linear-gradient(180deg,var(--afx-gold),var(--afx-gold-deep));color:#fff;box-shadow:0 6px 16px -6px rgba(138,100,32,.55);transition:transform .2s,box-shadow .2s,filter .2s}
                .afx-btn-gold:hover{transform:translateY(-1px);box-shadow:0 10px 22px -8px rgba(138,100,32,.6);filter:brightness(1.05)}
                .afx-btn-gold:active{transform:translateY(0) scale(.98)}
                .afx-btn-line{border:1px solid var(--afx-line);background:var(--afx-bg);color:var(--afx-text);transition:border-color .2s,transform .2s,background .2s}
                .afx-btn-line:hover{border-color:var(--afx-gold);background:var(--afx-surface)}
                .afx-btn-line:active{transform:scale(.98)}
                .afx :focus-visible{outline:2px solid var(--afx-gold);outline-offset:2px}

                /* ---------- hero ---------- */
                .afx-hero{position:relative;overflow:hidden;background:radial-gradient(520px 260px at 92% -10%,var(--afx-gold-soft),transparent 70%),radial-gradient(420px 220px at 0% 0%,rgba(176,130,37,.08),transparent 70%),linear-gradient(180deg,var(--afx-surface),var(--afx-bg))}
                .afx-hero::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(var(--afx-line) 1px,transparent 1.2px);background-size:22px 22px;opacity:.55;-webkit-mask-image:linear-gradient(100deg,transparent 40%,#000);mask-image:linear-gradient(100deg,transparent 40%,#000)}
                .afx-hero>*{position:relative;z-index:1}
                .afx-back{transition:gap .2s,color .2s}
                .afx-back:hover{gap:.5rem;text-decoration:none}


                /* ---------- explorer shell ---------- */
                .afx-explorer{position:relative;background:color-mix(in srgb,var(--afx-bg) 92%,#fff);border:1px solid var(--afx-line);border-radius:24px;box-shadow:0 1px 2px rgba(27,23,16,.04),0 24px 60px -24px rgba(80,60,20,.30);overflow:hidden}
                .afx-explorer::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,transparent,var(--afx-gold),transparent)}

                /* ---------- explorer inner controls (styles the child component) ---------- */
                .afx-explorer label{font-size:13px;font-weight:600;letter-spacing:.01em;color:var(--afx-text)}
                .afx-explorer input,.afx-explorer select{width:100%;height:52px;padding:0 16px;font-size:15px;color:var(--afx-text);background:var(--afx-surface);border:1px solid transparent;border-radius:14px;box-shadow:inset 0 0 0 1px var(--afx-line);transition:box-shadow .2s,background .2s}
                .afx-explorer input::placeholder{color:var(--afx-muted);opacity:.8}
                .afx-explorer input:hover,.afx-explorer select:hover{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--afx-gold) 55%,var(--afx-line))}
                .afx-explorer input:focus,.afx-explorer select:focus{outline:none;background:var(--afx-bg);box-shadow:inset 0 0 0 1.5px var(--afx-gold),0 0 0 4px var(--afx-gold-soft)}
                .afx-explorer button{border-radius:14px;transition:transform .2s,box-shadow .2s,background .2s,border-color .2s}
                .afx-explorer button:active{transform:scale(.97)}
                .afx-explorer button[type="submit"]{height:52px;padding:0 24px;font-weight:600;color:#fff;background:linear-gradient(180deg,var(--afx-gold),var(--afx-gold-deep));box-shadow:0 6px 16px -6px rgba(138,100,32,.55)}
                .afx-explorer button[type="submit"]:hover{transform:translateY(-1px);box-shadow:0 10px 22px -8px rgba(138,100,32,.6)}
                .afx-explorer button[type="reset"],.afx-explorer button[aria-label*="lear"]{height:52px;min-width:52px;border:1px solid var(--afx-line);background:var(--afx-bg)}
                .afx-explorer button[type="reset"]:hover,.afx-explorer button[aria-label*="lear"]:hover{border-color:var(--afx-gold);background:var(--afx-surface)}

                /* ---------- result cards ---------- */
                .afx-explorer article,.afx-explorer [data-afx-card]{background:var(--afx-bg);border:1px solid var(--afx-line);border-radius:14px;transition:transform .25s ease,border-color .25s,box-shadow .25s}
                .afx-explorer article:hover,.afx-explorer [data-afx-card]:hover{transform:translateY(-3px);border-color:var(--afx-gold);box-shadow:var(--afx-shadow)}
                .afx-explorer article:active,.afx-explorer [data-afx-card]:active{transform:translateY(-1px) scale(.995)}

                /* ---------- one page-load reveal ---------- */
                @keyframes afx-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
                .afx-in{animation:afx-rise .6s cubic-bezier(.2,.7,.2,1) both}
                @media(prefers-reduced-motion:reduce){.afx-in{animation:none}.afx-explorer article,.afx-btn-gold{transition:none}}

                /* ---------- mobile ---------- */
                @media(max-width:640px){
                    .afx-explorer input,.afx-explorer select{font-size:16px}
                    .afx-explorer{border-radius:16px}
                }
            `}</style>

            <section className="afx-hero px-5 pb-12 pt-10 sm:px-8 md:px-16 md:pb-16 md:pt-12 lg:px-24 xl:px-32">
                <div className="afx-in mx-auto max-w-7xl">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--afx-muted)]">
                        <Link to="/" className="afx-back inline-flex items-center gap-1.5 font-medium text-[var(--afx-gold-deep)]"><ArrowLeft size={15} /> Home</Link>
                        <span aria-hidden="true">/</span>
                        <span>Business directory</span>
                    </nav>
                    <h1 className="afx-serif mt-4 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">Browse businesses by district</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--afx-muted)] md:text-base">Choose a state and district, or search for a city or business to find public directory listings.</p>
                </div>
            </section>

            <section className="relative z-10 -mt-8 px-4 sm:px-8 md:-mt-10 md:px-16 lg:px-24 xl:px-32">
                <div className="afx-explorer afx-in mx-auto max-w-7xl px-4 pb-5 pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8" style={{ animationDelay: ".3s" }}>
                    <CustomerBusinessExplorer />
                </div>
            </section>
        </main>
    );
}