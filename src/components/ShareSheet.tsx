"use client";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  onCopyLink: () => void;
}

export default function ShareSheet({ isOpen, onClose, url, title, onCopyLink }: ShareSheetProps) {
  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-surface z-50 rounded-t-2xl border-t border-border-subtle shadow-2xl">
        <div className="p-4 border-b border-border-subtle">
          <h3 className="text-base font-bold text-foreground text-center">Share</h3>
        </div>

        <div className="p-4 space-y-2">
          <a
            href={`https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated hover:bg-zinc-800/60 transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/20 text-green-400 text-sm font-bold">WA</span>
            <span className="text-sm font-medium text-foreground">WhatsApp</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated hover:bg-zinc-800/60 transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">TG</span>
            <span className="text-sm font-medium text-foreground">Telegram</span>
          </a>

          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated hover:bg-zinc-800/60 transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-sm font-bold">GM</span>
            <span className="text-sm font-medium text-foreground">Gmail</span>
          </a>

          <button
            onClick={() => { onCopyLink(); onClose(); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-elevated hover:bg-zinc-800/60 transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-500/20 text-muted text-sm font-bold">📋</span>
            <span className="text-sm font-medium text-foreground">Copy Link</span>
          </button>
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-zinc-800 text-sm font-medium text-foreground hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
