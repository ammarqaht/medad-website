/* Timers set by public/boot.js; page scripts cancel them once they take over. */
interface Window {
  __medadBoot?: { js?: number; flood?: number; opening?: number };
}
