"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Anasayfa" },
  { href: "/ders-programi", label: "Ders Programı" },
  { href: "/sinav-takvimi", label: "Sınav Takvimi" },
  { href: "/akademik-takvim", label: "Akademik Takvim" },
  { href: "/menu", label: "Yemekhane" },
  { href: "/hakkinda", label: "Hakkında" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-50">
          Gruschedule
        </Link>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    active
                      ? "font-medium text-zinc-50"
                      : "text-zinc-400 transition-colors hover:text-zinc-200"
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
