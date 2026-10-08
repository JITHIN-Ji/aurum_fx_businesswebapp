import { useEffect } from 'react';
import Lenis from 'lenis';

export default function LenisScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true,
            smoothTouch: false,
            anchors: true,
        });
        const scrollToTop = () => lenis.scrollTo(0, { immediate: true });
        const pauseScroll = () => lenis.stop();
        const resumeScroll = () => lenis.start();
        window.addEventListener('afx:scroll-to-top', scrollToTop);
        window.addEventListener('afx:modal-open', pauseScroll);
        window.addEventListener('afx:modal-close', resumeScroll);

        const raf = (time) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };

        requestAnimationFrame(raf);

        return () => {
            window.removeEventListener('afx:scroll-to-top', scrollToTop);
            window.removeEventListener('afx:modal-open', pauseScroll);
            window.removeEventListener('afx:modal-close', resumeScroll);
            lenis.destroy();
        };
    }, []);

    return null;
}
