import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Palette,
  Image,
  BarChart3,
  CreditCard,
  Settings,
  Bot,
  Bell,
  ScrollText,
  PenTool,
  Settings2,
  Tag,
  Truck,
  Receipt,
  Star,
  Webhook,
  LayoutTemplate,
} from "lucide-react";

/**
 * The dashboard navigation, shared by the sidebar and the ⌘K command
 * palette so both always list exactly the same destinations.
 */
export interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    groupKey: "main",
    items: [
      { nameKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { nameKey: "stores", href: "/dashboard/stores", icon: Store },
    ],
  },
  {
    groupKey: "catalog",
    items: [
      { nameKey: "products", href: "/dashboard/products", icon: Package },
      { nameKey: "attributes", href: "/dashboard/products/attributes", icon: Settings2 },
      { nameKey: "pages", href: "/dashboard/pages", icon: FileText },
      { nameKey: "blog", href: "/dashboard/blog", icon: PenTool },
      { nameKey: "media", href: "/dashboard/media", icon: Image },
    ],
  },
  {
    groupKey: "sales",
    items: [
      { nameKey: "orders", href: "/dashboard/orders", icon: ShoppingCart },
      { nameKey: "discounts", href: "/dashboard/discounts", icon: Tag },
      { nameKey: "shipping", href: "/dashboard/shipping", icon: Truck },
      { nameKey: "taxes", href: "/dashboard/taxes", icon: Receipt },
      { nameKey: "customers", href: "/dashboard/customers", icon: Users },
      { nameKey: "reviews", href: "/dashboard/reviews", icon: Star },
      { nameKey: "webhooks", href: "/dashboard/webhooks", icon: Webhook },
    ],
  },
  {
    groupKey: "design",
    items: [
      { nameKey: "themes", href: "/dashboard/themes", icon: Palette },
      { nameKey: "templates", href: "/dashboard/templates", icon: LayoutTemplate },
      { nameKey: "marketplace", href: "/dashboard/marketplace", icon: Palette },
    ],
  },
  {
    groupKey: "engagement",
    items: [
      { nameKey: "analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { nameKey: "ai", href: "/dashboard/ai", icon: Bot },
      { nameKey: "notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    groupKey: "business",
    items: [
      { nameKey: "billing", href: "/dashboard/billing", icon: CreditCard },
      { nameKey: "team", href: "/dashboard/team", icon: Users },
      { nameKey: "auditLog", href: "/dashboard/audit", icon: ScrollText },
      { nameKey: "settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
