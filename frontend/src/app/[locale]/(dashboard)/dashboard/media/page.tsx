import { Metadata } from "next";
import { MediaGallery } from "@/features/media/media-gallery";
import { MediaStatsCards } from "@/features/media/media-stats-cards";

export const metadata: Metadata = {
  title: "Media Library - Tujjar",
  description: "Manage your media files and assets",
};

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-gray-500">Upload, organize, and manage your media files</p>
      </div>
      <MediaStatsCards />
      <MediaGallery />
    </div>
  );
}
