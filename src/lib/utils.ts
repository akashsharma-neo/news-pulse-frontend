/**
 * Simple sanitization utilities.
 * For production, consider using dompurify for full HTML sanitization.
 */

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function sanitizeHtml(htmlString: string): string {
  if (!htmlString) return '';
  return escapeHtml(htmlString);
}

export function sanitizePlainText(unsafeText: string): string {
  if (!unsafeText) return '';
  return escapeHtml(unsafeText);
}

/**
 * Strip HTML tags and decode common entities for display copy from the API.
 */
export function stripHtmlToPlainText(raw: string): string {
  if (!raw) return '';
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = raw;
    return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}