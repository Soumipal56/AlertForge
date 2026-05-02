import { useLocation, NavLink, Outlet } from "react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/layout/Sidebar";

const crumbLabels = {
  dashboard: "Dashboard", incidents: "Incidents", "war-room": "War Room",
  postmortem: "Postmortem", services: "Services",
  integrations: "Integrations & API Keys", status: "Status Page",
  team: "Team", settings: "Settings", new: "New Incident",
};

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: crumbLabels[seg] || seg,
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground/50 select-none">/</span>}
          {crumb.isLast
            ? <span className="font-medium text-white">{crumb.label}</span>
            : <NavLink to={crumb.path} className="text-zinc-400 transition-colors hover:text-white">{crumb.label}</NavLink>
          }
        </span>
      ))}
    </nav>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 bg-black px-4 text-zinc-100 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-700" />
          <Breadcrumbs />
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-4 bg-black p-6 text-zinc-100">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}