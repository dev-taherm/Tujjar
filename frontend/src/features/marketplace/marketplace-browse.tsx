"use client";

import { useState } from "react";
import type { MarketplaceListing } from "@/shared/types";
import { useMarketplaceListings, useMarketplaceCategories, useInstallListing } from "@/api/queries";
import { Badge, Button, Input } from "@/shared/ui";
import { Search, Download, Star, ExternalLink, ShoppingCart, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const install = useInstallListing();
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      {listing.screenshots?.[0] ? (
        <img src={listing.screenshots[0]} alt={listing.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <span className="text-primary-600 font-bold text-2xl">{listing.name[0]}</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{listing.name}</h3>
            <p className="text-xs text-gray-500">by {listing.developer_name}</p>
          </div>
          {listing.pricing_type === "free" ? (
            <Badge variant="success">Free</Badge>
          ) : (
            <Badge variant="warning">${listing.price}</Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{listing.short_description || listing.description}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{listing.rating_average.toFixed(1)} ({listing.rating_count})</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3" />{listing.download_count}</span>
          {listing.category && <Badge variant="secondary">{listing.category}</Badge>}
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => install.mutate(listing.id)} disabled={install.isPending}>
            <ShoppingCart className="mr-1 h-3 w-3" /> {install.isPending ? "Installing..." : "Install"}
          </Button>
          {listing.demo_url && (
            <Button size="sm" variant="outline" onClick={() => window.open(listing.demo_url)}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MarketplaceBrowse() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [pricingFilter, setPricingFilter] = useState<string>("");

  const { data: categories } = useMarketplaceCategories();
  const { data: listings, isLoading } = useMarketplaceListings({
    category: selectedCategory || undefined,
    pricing_type: pricingFilter || undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search themes..." className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm" />
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
          <button onClick={() => setSelectedCategory("")} className={cn("rounded px-3 py-1 text-xs", !selectedCategory && "bg-gray-100")}>All</button>
          {categories?.categories.slice(0, 5).map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("rounded px-3 py-1 text-xs", selectedCategory === cat && "bg-gray-100")}>{cat}</button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
          <button onClick={() => setPricingFilter("")} className={cn("rounded px-3 py-1 text-xs", !pricingFilter && "bg-gray-100")}>All</button>
          <button onClick={() => setPricingFilter("free")} className={cn("rounded px-3 py-1 text-xs", pricingFilter === "free" && "bg-gray-100")}>Free</button>
          <button onClick={() => setPricingFilter("paid")} className={cn("rounded px-3 py-1 text-xs", pricingFilter === "paid" && "bg-gray-100")}>Paid</button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : !listings?.length ? (
        <div className="text-center py-16 text-gray-500">No themes found</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
