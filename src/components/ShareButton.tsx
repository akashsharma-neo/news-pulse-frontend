"use client";

import { useState } from "react";
import Toast from "@/components/Toast";
import ShareSheet from "@/components/ShareSheet";

interface ShareButtonProps {
  path: string;
  title: string;
}

export default function ShareButton({ path, title }: ShareButtonProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  const url = `${window.location.origin}${path}`;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSheetOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage("Link copied to clipboard");
      setToastKey((k) => k + 1);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-muted hover:text-accent p-2 rounded-lg transition-colors"
        aria-label="Share article"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>

      <ShareSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        url={url}
        title={title}
        onCopyLink={handleCopyLink}
      />

      <Toast key={toastKey} message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
