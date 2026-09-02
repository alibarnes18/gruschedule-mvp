"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
              {LINKS.map((link, index) => (
                <motion.li
                  key={link.href}
                  data-slot="sidebar-menu-item"
                  data-sidebar="menu-item"
                  className="group/menu-item relative"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <SidebarMenuButton
                      isActive={isActive(pathname, link.href)}
                      tooltip={link.label}
                      className="transition-colors duration-150"
                      render={<Link href={link.href} />}
                    >
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </motion.div>
                </motion.li>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
