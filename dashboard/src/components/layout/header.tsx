"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, FolderOpen, Activity, Kanban, Home, BarChart3, HelpCircle } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/board", label: "Quadro", icon: LayoutDashboard },
  { href: "/sprint", label: "Sprint", icon: Zap },
  { href: "/projects", label: "Projetos", icon: FolderOpen },
  { href: "/activity", label: "Atividade", icon: Activity },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/help", label: "Help", icon: HelpCircle },
];

interface HeaderProps {
  wsConnected: boolean;
}

export function Header({ wsConnected }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Kanban className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg hidden sm:inline-block">Kanbania</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                wsConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="hidden sm:inline">{wsConnected ? "Ao vivo" : "Offline"}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
