/**
 * Tap-to-ask suggestion chips for the Nex chat empty state.
 */

interface NexSuggestionChipsProps {
  prompts: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export default function NexSuggestionChips({
  prompts,
  onSelect,
  disabled = false,
}: NexSuggestionChipsProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {prompts.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="w-full min-h-[44px] text-left text-sm text-foreground px-4 py-3 rounded-xl bg-surface-elevated border border-border-subtle hover:bg-zinc-800/60 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none leading-snug"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
