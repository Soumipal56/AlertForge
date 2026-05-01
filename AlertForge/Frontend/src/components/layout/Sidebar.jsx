// src/components/layout/Sidebar.jsx
// Dependencies needed:
// npx shadcn@latest add sidebar dropdown-menu avatar separator skeleton

import { NavLink, useLocation, useNavigate } from "react-router";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  AlertTriangle,
  Server,
  Plug,
  Users,
  Globe,
  Swords,
  ScrollText,
  ChevronsUpDown,
  LogOut,
  Zap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Nav config ──────────────────────────────────────────────────────────────
// Set badge to a number > 0 to show it. Wire up real counts from Redux later.

const mainNav = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    to: "/dashboard",
    end: true,
  },
  {
    label: "Incidents",
    icon: AlertTriangle,
    to: "/dashboard/incidents",
    badge: 3, // 🔴 replace with live count from store
  },
  {
    label: "War Room",
    icon: Swords,
    to: "/dashboard/war-room",
  },
  {
    label: "Postmortem",
    icon: ScrollText,
    to: "/dashboard/postmortem",
  },
];

const infraNav = [
  {
    label: "Services",
    icon: Server,
    to: "/dashboard/services",
  },
  {
    label: "Integrations & API Keys",
    icon: Plug,
    to: "/dashboard/integrations",
  },
  {
    label: "Status Page",
    icon: Globe,
    to: "/dashboard/status",
  },
];

const workspaceNav = [
  {
    label: "Team",
    icon: Users,
    to: "/dashboard/team",
  },
];

// ─── Reusable nav group ───────────────────────────────────────────────────────

function NavGroup({ label, items }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel className="text-white/60">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white"
                >
                  <NavLink to={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>

                {item.badge != null && item.badge > 0 && (
                  <SidebarMenuBadge className="bg-destructive text-destructive-foreground text-[10px]">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// ─── User footer ──────────────────────────────────────────────────────────────

function UserFooter() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ||
    user.emailAddresses[0]?.emailAddress[0].toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarFooter className="bg-black text-white">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white"
              >
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarImage src={user.imageUrl} alt={user.fullName} />
                  <AvatarFallback className="rounded-lg bg-white/15 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.fullName || "User"}
                  </span>
                  <span className="truncate text-xs text-white/70">
                    {user.emailAddresses[0]?.emailAddress}
                  </span>
                </div>

                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-white/70" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-white/10 bg-black text-white"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              {/* User info */}
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarImage src={user.imageUrl} alt={user.fullName} />
                  <AvatarFallback className="rounded-lg bg-white/15 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid text-sm leading-tight">
                  <span className="font-semibold">{user.fullName}</span>
                  <span className="text-xs text-white/70">
                    {user.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" className="border-r border-white/10" {...props}>

      {/* Brand */}
      <SidebarHeader className="bg-black text-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="AlertForge"
              className="text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white"
            >
              <NavLink to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10 text-white shrink-0">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight">
                    AlertForge
                  </span>
                  <span className="truncate text-xs text-white/70">
                    Incident Platform
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="bg-black text-white">
        <NavGroup items={mainNav} />
        <SidebarSeparator />
        <NavGroup label="Infrastructure" items={infraNav} />
        <SidebarSeparator />
        <NavGroup label="Workspace" items={workspaceNav} />
      </SidebarContent>

      {/* User */}
      <UserFooter />

      {/* Click rail to collapse/expand */}
      <SidebarRail />
    </Sidebar>
  );
}