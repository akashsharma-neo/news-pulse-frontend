/**
 * Client-side fallback Nex questions when the API has no suggested_prompts yet.
 */

export const GENERIC_NEX_PROMPTS = [
  "What are the main facts in this story?",
  "Who is most affected by this?",
  "What might happen next?",
] as const;

export function resolveNexPrompts(apiPrompts?: string[] | null): string[] {
  const fromApi = (apiPrompts ?? []).map((p) => p.trim()).filter(Boolean);
  if (fromApi.length >= 3) {
    return fromApi.slice(0, 3);
  }
  return [...GENERIC_NEX_PROMPTS];
}
