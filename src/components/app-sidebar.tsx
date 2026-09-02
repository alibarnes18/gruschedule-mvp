"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  Home,
  Info,
  UtensilsCrossed,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const LINKS = [
  { href: "/", label: "Anasayfa", icon: Home },
  { href: "/ders-programi", label: "Ders Programı", icon: BookOpenCheck },
  { href: "/sinav-takvimi", label: "Sınav Takvimi", icon: CalendarClock },
  { href: "/akademik-takvim", label: "Akademik Takvim", icon: CalendarDays },
  { href: "/menu", label: "Yemekhane", icon: UtensilsCrossed },
  { href: "/hakkinda", label: "Hakkında", icon: Info },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="px-2 py-1 text-sm font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden"
        >
          Gruschedule
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {LINKS.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    isActive={isActive(pathname, link.href)}
                    tooltip={link.label}
                    render={<Link href={link.href} />}
                  >
                    <link.icon />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
