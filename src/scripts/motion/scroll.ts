/* Smooth scroll (Lenis) driving GSAP ScrollTrigger. Import only on pages with
   scroll-linked motion so other pages ship none of it. With reduced motion,
   Lenis stays off and native scrolling is kept. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './reduced';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function initScroll(): { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger; lenis: Lenis | null } {
  if (!lenis && !reducedMotion()) {
    lenis = new Lenis({ autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  return { gsap, ScrollTrigger, lenis };
}
