import { Link } from "react-router-dom";

const year = new Date().getFullYear();

// Links point at the section ids in Home.jsx
const navLinks = [
    { name: "About", href: "#about" },
    { name: "How it works", href: "#how" },
    { name: "Browse districts", href: "#coverage" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
    { name: "Field staff login", href: "/staff" },
];

export default function Footer() {
    return (
        <footer className="relative px-6 md:px-16 lg:px-24 xl:px-32 mt-40 w-full dark:text-slate-50">
            {/* Large faded brand text, in the spot the template used for its artwork */}
            <p aria-hidden="true"
                className="absolute w-full max-w-4xl -mt-24 md:-mt-32 right-0 md:right-16 lg:right-24 xl:right-32 top-0 text-right text-7xl md:text-9xl font-semibold leading-none pointer-events-none select-none text-[#B08225]/15 dark:text-[#D9AE4B]/15 max-md:px-4"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                AurumFX
            </p>
            <div className="relative grid w-full grid-cols-1 gap-10 border-b border-gray-200 pb-6 dark:border-slate-700 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14">
                <div className="min-w-0">
                    <a href="/" className="flex w-fit items-center whitespace-nowrap" aria-label="AurumFX home">
                        <img src="/logo.png" alt="" className="mr-2 size-10 object-contain" />
                        <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                            Aurum<span className="text-[#B08225] dark:text-[#D9AE4B]">FX</span>
                        </span>
                    </a>
                    <p className="mt-6">
                        AurumFX field teams visit shops and businesses in every district across India and record them in one verified directory. Browse by state and district to see who trades what, and where.
                    </p>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] items-start gap-8 lg:gap-12">
                    <div className="min-w-0">
                        <h2 className="font-semibold mb-5">Company</h2>
                        <ul className="space-y-2">
                            {navLinks.map((link) => (
                                <li key={link.name}>
                                    {link.href.startsWith("/")
                                        ? <Link to={link.href} className="whitespace-nowrap hover:text-[#B08225] transition">{link.name}</Link>
                                        : <a href={link.href} className="whitespace-nowrap hover:text-[#B08225] transition">{link.name}</a>}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div id="contact" className="min-w-0 scroll-mt-24">
                        <h2 className="font-semibold mb-5">Get in touch</h2>
                        <div className="space-y-2 leading-relaxed">
                            <p><a href="tel:+917510214080" className="hover:text-[#B08225] transition">+91 75102 14080</a></p>
                            <p><a href="mailto:info@aurumfx.in" className="hover:text-[#B08225] transition">info@aurumfx.in</a></p>
                            <address className="max-w-xs not-italic">
                                First Floor, V/664,<br />
                                Thekkekkara Antony Master Square,<br />
                                Kunnathangadi, PO Veluthur,<br />
                                Thrissur 680012
                            </address>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-4 text-center pb-5">
                Copyright {year} © AurumFX. All rights reserved.
            </p>
        </footer>
    );
}