"use client";

import Link from "next/link";
import { useThemes } from "@/api/queries";
import { ThemeCard } from "./theme-card";
import { Palette, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui";

export function ThemeList() {
  const { data: themes, isLoading } = useThemes();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const installedThemes = themes?.filter((t) => !t.is_system) ?? [];

  return (
    <div>
      {!installedThemes.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
          <Palette className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No themes installed</h3>
          <p className="mb-6 text-sm text-gray-500">Browse the marketplace to install a theme.</p>
          <Link href="/dashboard/marketplace">
            <Button>
              <ExternalLink className="me-2 h-4 w-4" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {installedThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}
