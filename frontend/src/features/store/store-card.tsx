"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/shared/ui";
import { Store, MoreVertical, Globe, ExternalLink } from "lucide-react";
import type { Store as StoreType } from "@/shared/types";

interface StoreCardProps {
  store: StoreType;
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/dashboard/stores/${store.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                <Store className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{store.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {store.domain}
                </CardDescription>
              </div>
            </div>
            <Badge variant={store.is_active ? "success" : "secondary"}>
              {store.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{store.description || "No description"}</span>
            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
