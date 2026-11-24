"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface GalleryImage {
  url: string;
  alt?: string | null;
}

/**
 * Product image gallery: main image with thumbnail strip. Clicking a
 * thumbnail switches the main image. Server-rendered initial image.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: GalleryImage[];
  alt: string;
}) {
  const t = useTranslations("storefront.product");
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-xl"
        style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
      >
        {t("noImage")}
      </div>
    );
  }

  const main = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div
        className="aspect-square w-full overflow-hidden rounded-xl"
        style={{ background: "var(--color-surface)" }}
      >
        <img
          src={main.url}
          alt={main.alt || alt}
          width={800}
          height={800}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.url}
              onClick={() => setActive(index)}
              className="flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors"
              style={{
                borderColor: index === active ? "var(--color-primary)" : "transparent",
                width: 64,
                height: 64,
              }}
              aria-label={`${t("viewImage")} ${index + 1}`}
            >
              <img
                src={image.url}
                alt={image.alt || alt}
                width={64}
                height={64}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
