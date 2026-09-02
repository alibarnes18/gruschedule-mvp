"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import LineSidebar from "@/components/line-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const LINKS = [
  { href: "/", label: "Anasayfa" },
  { href: "/ders-programi", label: "Ders Programı" },
  { href: "/sinav-takvimi", label: "Sınav Takvimi" },
  { href: "/akademik-takvim", label: "Akademik Takvim" },
  { href: "/menu", label: "Yemekhane" },
  { href: "/hakkinda", label: "Hakkında" },
];

function activeIndexFor(pathname: string): number | null {
  const index = LINKS.findIndex((link) =>
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href),
  );
  return index === -1 ? null : index;
}

export function AppNav({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function goTo(index: number) {
    const link = LINKS[index];
    if (link) router.push(link.href);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border px-6 py-6 md:flex">
        <Link href="/" className="mb-8 text-sm font-semibold tracking-tight text-foreground">
          Gruschedule
        </Link>
        <LineSidebar
          key={pathname}
          items={LINKS.map((l) => l.label)}
          defaultActive={activeIndexFor(pathname)}
          onItemClick={(index) => goTo(index)}
          accentColor="#3b82f6"
          textColor="#8a8a8a"
          markerColor="#3f3f3f"
          fontSize={1}
          itemGap={22}
          proximityRadius={90}
        />
        <div className="mt-auto pt-6">
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" aria-label="Menüyü aç" />}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Gruschedule</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <LineSidebar
                  key={pathname}
                  items={LINKS.map((l) => l.label)}
                  defaultActive={activeIndexFor(pathname)}
                  onItemClick={(index) => goTo(index)}
                  accentColor="#3b82f6"
                  textColor="#8a8a8a"
                  showMarker={false}
                  fontSize={1}
                  itemGap={18}
                />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold text-foreground">Gruschedule</span>
          <ThemeToggle />
        </header>

        {children}
      </div>
    </div>
  );
}
