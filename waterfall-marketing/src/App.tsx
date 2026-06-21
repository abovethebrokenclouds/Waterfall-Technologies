/**
 * App.tsx — providers + routing.
 *
 * Structure:
 *   <StoreProvider>      global marketing data + AI context (localStorage-backed)
 *     <TooltipProvider>  shadcn tooltips
 *       <BrowserRouter>  one flat route per module, all inside <AppLayout/>
 *
 * To add a module: create a page in src/pages, add a <Route>, and a NAV item in
 * components/layout/Sidebar.tsx. Nothing else needs to change.
 */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/store/AppStore";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "@/pages/Dashboard";
import BrandApps from "@/pages/BrandApps";
import Campaigns from "@/pages/Campaigns";
import Seo from "@/pages/Seo";
import Email from "@/pages/Email";
import Video from "@/pages/Video";
import Social from "@/pages/Social";
import Assets from "@/pages/Assets";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={200}>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/brand" element={<BrandApps />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/seo" element={<Seo />} />
              <Route path="/email" element={<Email />} />
              <Route path="/video" element={<Video />} />
              <Route path="/social" element={<Social />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StoreProvider>
  );
}
