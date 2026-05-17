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