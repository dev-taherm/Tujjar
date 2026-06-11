"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { useThemes, useThemeMarketplace } from "@/api/queries";
import { ThemeCard } from "./theme-card";
import { Plus, Palette, Download } from "lucide-react";

export function ThemeList() {
  const { data: themes, isLoading } = useThemes();
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
        !themes?.length ? (
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
            {themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        )
      ) : (
        <MarketplaceList />
      )}
    </div>
  );
}

function MarketplaceList() {
  const { data: themes, isLoading } = useThemeMarketplace();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {themes?.map((theme) => (
        <ThemeCard key={theme.id} theme={theme} />
      ))}
    </div>
  );
}
