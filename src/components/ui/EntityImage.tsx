import { useState } from "react";
import { GOLD, SERIF } from "./theme";

// ---------------------------------------------------------------------------
// Image status cache — persists across re-renders and navigations
// ---------------------------------------------------------------------------
// Tracks URLs that failed (404/network error) so we never re-request them,
// and URLs that loaded successfully so we can skip the loading state.

const imageCache = new Map<string, "loaded" | "failed">();

/** Check if a URL is already known to have failed. */
export function isImageCachedAsFailed(url: string): boolean {
  return imageCache.get(url) === "failed";
}

// ---------------------------------------------------------------------------
// EntityImage — themed image component with graceful error handling
// ---------------------------------------------------------------------------

export interface EntityImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

/**
 * Displays an entity image with a gold-bordered D&D theme.
 * If the image fails to load (404 / network error), it hides itself
 * completely so missing images never break the layout.
 *
 * Failed URLs are cached in-memory so they are never re-requested
 * across re-renders or page navigations within the same session.
 */
export function EntityImage({
  src,
  alt,
  width,
  height,
  style,
}: EntityImageProps) {
  const cachedStatus = imageCache.get(src);
  const [hasError, setHasError] = useState(cachedStatus === "failed");

  if (hasError || cachedStatus === "failed") {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: GOLD,
          fontSize: "12px",
          fontFamily: SERIF,
          textDecoration: "underline",
          opacity: 0.7,
          ...style,
        }}
      >
        {alt || "View image"}
      </a>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => imageCache.set(src, "loaded")}
      onError={() => {
        imageCache.set(src, "failed");
        setHasError(true);
      }}
      style={{
        maxWidth: "100%",
        borderRadius: "8px",
        border: `2px solid ${GOLD}`,
        boxShadow: "0 0 20px rgba(201,168,76,0.2)",
        objectFit: "contain",
        background: "rgba(0,0,0,0.3)",
        fontFamily: SERIF,
        ...(width != null ? { width } : {}),
        ...(height != null ? { height } : {}),
        ...style,
      }}
    />
  );
}
