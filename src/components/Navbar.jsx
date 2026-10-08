import { MenuIcon, User, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Links point at the section ids in Home.jsx
const navLinks = [
    { name: "About", href: "#about" },
    { name: "How it works", href: "#how" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
];

export default function Navbar() {
    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState("");
    const { pathname } = useLocation();

    useEffect(() => {
        document.body.classList.toggle("max-lg:overflow-hidden", openMobileMenu);
        return () => document.body.classList.remove("max-lg:overflow-hidden");
    }, [openMobileMenu]);

    // Soft background and shadow once the page has scrolled
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Highlight the link of the section currently on screen
    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
            { rootMargin: "-40% 0px -55% 0px" }
        );
        navLinks.forEach((l) => {
            if (!l.href.startsWith("#")) return;
            const el = document.querySelector(l.href);
            if (el) io.observe(el);
        });
        return () => io.disconnect();
    }, []);

    const linkClass = (href) =>
        `relative py-2 text-sm font-medium transition-colors
         after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:bg-[#B08225] after:transition-transform after:duration-300
         ${active === href
            ? "text-[#8A6420] dark:text-[#E3BF68] after:scale-x-100"
            : "hover:text-[#8A6420] dark:hover:text-[#E3BF68] after:scale-x-0 hover:after:scale-x-100"}`;

    if (pathname === "/browse-districts") return null;

    return (
        <nav className={`fixed z-50 top-0 w-full px-6 md:px-16 lg:px-24 xl:px-32 transition-all duration-300
            ${scrolled || openMobileMenu ? "py-3" : "py-5"}
            ${scrolled && !openMobileMenu ? "backdrop-blur-md bg-[#FAF6EC]/80 dark:bg-[#14110B]/80 shadow-[0_10px_30px_-20px_rgba(60,40,0,0.45)]" : ""}`}>
            <div className="flex items-center justify-between gap-6 xl:gap-10">
                {/* Logo */}
                <a href="/" className="flex w-fit shrink-0 items-center whitespace-nowrap" aria-label="AurumFX home">
                    <img src="/logo.png" alt="" className="mr-2 size-10 object-contain" />
                    <span className="text-2xl font-semibold tracking-tight text-[#1B1710] dark:text-[#F3ECDA]"
                        style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                        Aurum<span className="text-[#B08225] dark:text-[#D9AE4B]">FX</span>
                    </span>
                </a>

                {/* Links, centred */}
                <div className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8 whitespace-nowrap">
                    {navLinks.map((link) => (
                        link.href.startsWith("/")
                            ? <Link key={link.name} to={link.href} className={linkClass(link.href)}>{link.name}</Link>
                            : <a key={link.name} href={link.href} className={linkClass(link.href)}>{link.name}</a>
                    ))}
                </div>

                {/* Primary navigation actions */}
                <div className="flex items-center justify-end gap-3 shrink-0 whitespace-nowrap">
                    <Link to="/browse-districts"
                        className="hidden lg:inline-flex items-center gap-2 h-11 px-4 rounded-md text-sm font-medium text-white bg-[#B08225] hover:bg-[#8A6420] transition-colors">
                        Browse districts
                    </Link>
                    <Link to="/staff"
                        className="hidden lg:inline-flex items-center gap-2 h-11 px-4 rounded-md text-sm font-medium transition-colors
                                   text-[#8A6420] dark:text-[#E3BF68] bg-[#B08225]/10 hover:bg-[#B08225]/20">
                        <User size={17} strokeWidth={1.8} /> Field staff login
                    </Link>
                    <button onClick={() => setOpenMobileMenu(!openMobileMenu)} className="lg:hidden grid place-items-center size-11" aria-label="Open menu" aria-expanded={openMobileMenu}>
                        <MenuIcon size={26} className="active:scale-90 transition" />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`fixed inset-0 flex flex-col items-center justify-center gap-6 text-lg font-medium bg-[#FAF6EC]/95 dark:bg-[#14110B]/95 backdrop-blur-md lg:hidden transition duration-300 ${openMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
                <button aria-label="Close menu" onClick={() => setOpenMobileMenu(false)}
                    className="absolute right-6 top-5 aspect-square size-10 p-1 items-center justify-center bg-[#B08225] hover:bg-[#8A6420] transition text-white rounded-md flex">
                    <XIcon />
                </button>
                {navLinks.map((link) => (
                    link.href.startsWith("/")
                        ? <Link key={link.name} to={link.href} onClick={() => setOpenMobileMenu(false)}>{link.name}</Link>
                        : <a key={link.name} href={link.href} onClick={() => setOpenMobileMenu(false)}>{link.name}</a>
                ))}
                <Link to="/browse-districts" onClick={() => setOpenMobileMenu(false)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#B08225] px-6 py-3 text-white transition-colors hover:bg-[#8A6420]">
                    Browse districts
                </Link>
                <Link to="/staff" onClick={() => setOpenMobileMenu(false)}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-md text-[#8A6420] dark:text-[#E3BF68] bg-[#B08225]/10">
                    <User size={18} /> Field staff login
                </Link>
            </div>
        </nav>
    );
}