/**
 * AppLayout — the persistent shell: sidebar + top bar (with product picker) +
 * routed page content + the global AI assistant. Responsive: the sidebar
 * collapses into a drawer on small screens.
 */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { AiAssistantPanel } from "./AiAssistantPanel";
import { ProductPicker } from "@/components/common/ProductPicker";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-assisted marketing OS</span>
            </div>
          </div>
          <ProductPicker />
        </header>

        {/* Routed content */}
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <AiAssistantPanel />
    </div>
  );
}
