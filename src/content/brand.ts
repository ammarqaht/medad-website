/* The brand word rule (MEDAD.md §2): wherever Medad appears it is «مـــــداد»
   (م + five tatweels + داد) in Thmanyah Serif Display 900. The font turns it
   into the logo's exact ligature. In copy, write the token {مداد}. */
export const BRAND = 'مـــــداد';
const TOKEN = /\{مداد\}/g;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/** Copy to HTML: everything escaped, {مداد} becomes the brand span. */
export function html(str: string): string {
  return escapeHtml(str).replace(
    TOKEN,
    `<span class="brand-word" role="img" aria-label="مداد">${BRAND}</span>`,
  );
}

/** Copy to plain text, for <title>, aria-label and alt. */
export function text(str: string): string {
  return str.replace(TOKEN, BRAND);
}
