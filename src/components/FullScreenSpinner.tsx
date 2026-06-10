export default function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-accent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
