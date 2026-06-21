/**
 * Sidebar — flat, minimal navigation (no nested menus). Each module maps to a
 * single route. The labels match the spec exactly so the IA is obvious.
 */
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Megaphone,
  Search,
  Mail,
  Clapperboard,
  Share2,
  Library,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/brand", label: "Brand & Apps", icon: Boxes },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/seo", label: "SEO & Content", icon: Search },
  { to: "/email", label: "Email", icon: Mail },
  { to: "/video", label: "Video", icon: Clapperboard },
  { to: "/social", label: "Social", icon: Share2 },
  { to: "/assets", label: "Assets", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  /** Mobile: called after navigating so the drawer can close. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border p-4">
        <h1 className="gradient-text text-lg font-bold tracking-tight">Waterfall</h1>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Marketing
        </p>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
            W
          </div>
          <div className="text-xs">
            <div className="font-medium">Waterfall Tech</div>
            <div className="text-muted-foreground">Marketing OS</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
