import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gruschedule",
  description:
    "Giresun Üniversitesi akademik takvim, sınav takvimi, ders programı ve yemekhane menüsü tek yerde.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
                  <SidebarTrigger />
                  <ThemeToggle />
                </header>
                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
                  {children}
                </main>
                <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                  Gruschedule — Giresun Üniversitesi için gayriresmî bir öğrenci aracı.
                </footer>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
