export default function RecallPanel() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="mb-4 text-4xl" aria-hidden>
        ⚔️
      </span>
      <h2 className="font-display text-xl font-bold">Active Recall</h2>
      <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-muted">
        Spaced-repetition MCQs from the stories you read 1, 3 and 7 days ago — with
        streaks and leaderboards. Landing in the next release.
      </p>
      <span className="label-caps mt-5 rounded-full border border-accent/40 px-3 py-1 text-[10px] text-accent">
        Coming soon
      </span>
    </div>
  );
}
