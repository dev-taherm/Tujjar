"use client";

import { use } from "react";
import { Button } from "@/shared/ui";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
      <div className="mt-8 rounded-xl border border-gray-200 p-12 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-gray-500">Add items to your cart to see them here.</p>
        <Link href={`/shop/${slug}/shop`} className="mt-6 inline-block">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
