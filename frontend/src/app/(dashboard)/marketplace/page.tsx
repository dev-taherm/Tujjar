import { Metadata } from "next";
import { MarketplaceBrowse } from "@/features/marketplace/marketplace-browse";

export const metadata: Metadata = {
  title: "Marketplace - Tujjar",
  description: "Browse and install themes from the marketplace",
};

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Theme Marketplace</h1>
        <p className="text-gray-500">Discover and install themes built by the community</p>
      </div>
      <MarketplaceBrowse />
    </div>
  );
}
