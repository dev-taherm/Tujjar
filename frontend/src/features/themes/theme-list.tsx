"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { useThemes, useThemeMarketplace, useInstallTheme } from "@/api/queries";
import { ThemeCard } from "./theme-card";
import { Palette, Download, AlertCircle, RefreshCw } from "lucide-react";

export function ThemeList() {
  const { data: themes, isLoading, error } = useThemes();
  const [activeTab, setActiveTab] = useState<"installed" | "marketplace">("installed");

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Themes</h2>
          <p className="text-sm text-gray-500">Customize your store appearance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "installed" ? "default" : "outline"}
            onClick={() => setActiveTab("installed")}
          >
            <Palette className="mr-2 h-4 w-4" />
            Installed
          </Button>
          <Button
            variant={activeTab === "marketplace" ? "default" : "outline"}
            onClick={() => setActiveTab("marketplace")}
          >
            <Download className="mr-2 h-4 w-4" />
            Marketplace
          </Button>
        </div>
      </div>

      {activeTab === "installed" ? (
        error ? (
          <ErrorState onRetry={() => window.location.reload()} />
        ) : !installedThemes.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
            <Palette className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No themes installed</h3>
            <p className="mb-6 text-sm text-gray-500">Browse the marketplace to install a theme.</p>
            <Button onClick={() => setActiveTab("marketplace")}>
              <Download className="mr-2 h-4 w-4" />
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {installedThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        )
      ) : (
        <MarketplaceList installedThemeIds={installedThemes.map((t) => t.parent_theme).filter(Boolean) as string[]} />
      )}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 py-16">
      <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">Something went wrong</h3>
      <p className="mb-6 text-sm text-gray-500">Failed to load themes. Please try again.</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function MarketplaceList({ installedThemeIds }: { installedThemeIds: string[] }) {
  const { data: themes, isLoading, error } = useThemeMarketplace();
  const installTheme = useInstallTheme();
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = (theme: { id: string }) => {
    setInstallingId(theme.id);
    installTheme.mutate(theme.id, {
      onSettled: () => setInstallingId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  if (!themes?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
        <Download className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No themes available</h3>
        <p className="text-sm text-gray-500">Check back later for new themes.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          onInstall={handleInstall}
          isInstalling={installingId === theme.id}
          isInstalled={installedThemeIds.includes(theme.id)}
        />
      ))}
    </div>
  );
}
