"use client";

import {
  BarChart3,
  Heart,
  Mail,
  User,
} from "lucide-react";
import Image from "next/image";
import { Link, usePathname } from "~/lib/i18n/navigation";

import { cn } from "~/lib/utils";

const navItems = [
  // {
  //   title: "Overview",
  //   href: "/dashboard",
  //   icon: LayoutDashboard,
  // },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Couple Questions",
    href: "/couple-questions",
    icon: Heart,
  },
  {
    title: "Usage",
    href: "/dashboard/usage",
    icon: BarChart3,
  },
  // {
  //   title: "Billing & Invoices",
  //   href: "/dashboard/billing",
  //   icon: CreditCard,
  // },
  {
    title: "Contact Us",
    href: "/dashboard/contact",
    icon: Mail,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r bg-background">
      {/* Logo section */}
      <div className="flex h-16 items-center border-b px-4">
        {/* Logo removed as per request */}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
