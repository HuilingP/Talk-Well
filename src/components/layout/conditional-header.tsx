"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

export function ConditionalHeader() {
  const pathname = usePathname();
  const showHeader = !pathname.includes("/dashboard");

  return showHeader ? <Header /> : null;
}
