/**
 * Story lead image — uses native img for hotlinked publisher CDNs.
 */

"use client";

import { useState } from "react";

interface StoryImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClass?: string;
}

export default function StoryImage({
  src,
  alt,
  className = "",
  aspectClass = "aspect-video",
}: StoryImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return null;
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-surface-elevated ${aspectClass} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
