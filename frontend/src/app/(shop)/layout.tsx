"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Search } from "lucide-react";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const slug = pathname.split("/")[1] || "";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/shop/${slug}`} className="text-xl font-bold text-gray-900">
            Store
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link href={`/shop/${slug}/shop`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href={`/shop/${slug}/shop/collections`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Collections
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Search className="h-5 w-5" />
            </button>
            <Link href={`/shop/${slug}/shop/cart`} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                0
              </span>
            </Link>
            <Link href="/login" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-sm text-gray-500">
            <div>
              <h4 className="mb-3 font-semibold text-gray-900">Shop</h4>
              <div className="space-y-2">
                <Link href={`/shop/${slug}/shop`} className="block hover:text-gray-900">All Products</Link>
                <Link href={`/shop/${slug}/shop/collections`} className="block hover:text-gray-900">Collections</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-gray-900">Help</h4>
              <div className="space-y-2">
                <span className="block">Shipping</span>
                <span className="block">Returns</span>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-gray-900">Company</h4>
              <div className="space-y-2">
                <span className="block">About</span>
                <span className="block">Contact</span>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
            Powered by Tujjar
          </div>
        </div>
      </footer>
    </div>
  );
}
