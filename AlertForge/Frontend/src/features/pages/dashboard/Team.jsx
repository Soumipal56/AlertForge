import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Shield,
  Eye,
  Radio,
  MoreHorizontal,
  UserPlus,
  Mail,
  Clock,
  AlertTriangle,
  ChevronDown,
  X,
  RefreshCw,
  Trash2,
  UserCog,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { teamApi } from "@/api/team.api";
import { normalizeMember } from "@/lib/mapper";

const ROLES = ["Admin", "Responder", "Viewer"];

const roleConfig = {
  Admin: {
    badge: "bg-violet-950/70 text-violet-200 border border-violet-800/80",
    icon: Shield,
    iconClass: "text-violet-400",
    description: "Full access — manage team, billing, integrations, and all incidents",
    can: ["Manage all incidents", "Invite & remove members", "Change member roles", "Access all integrations", "Manage API keys"],
  },
  Responder: {
    badge: "bg-blue-950/60 text-blue-200 border border-blue-800/70",
    icon: Radio,
    iconClass: "text-blue-400",
    description: "Can respond to and manage incidents — no team or billing access",
    can: ["Create & update incidents", "Post timeline updates", "Access War Room", "Generate postmortems", "View all services"],
  },
  Viewer: {
    badge: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    icon: Eye,
    iconClass: "text-zinc-500",
    description: "Read-only access — can view incidents and status but cannot make changes",
    can: ["View all incidents", "View timelines", "View status page", "View analytics"],
  },
};

const dropdownContentClass =
  "w-48 border border-zinc-700 bg-zinc-950 text-zinc-100 [&_[data-slot=dropdown-menu-radio-item]]:focus:bg-zinc-800 [&_[data-slot=dropdown-menu-radio-item]]:focus:text-zinc-100 [&_[data-slot=dropdown-menu-item]]:focus:bg-zinc-800";

function MemberRow({ member, onRoleChange, onRemove, isCurrentUser }) {
  const roleCfg = roleConfig[member.role] || roleConfig.Viewer;
  const initials = member.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center border-b border-zinc-800 px-0 py-4 text-sm transition-colors hover:bg-zinc-950/60">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-200">
            {initials}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black ${member.online ? "bg-emerald-500" : "bg-zinc-600"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-200 truncate">{member.name}</p>
            {isCurrentUser && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 font-medium shrink-0">You</span>}
          </div>
          <p className="text-[11px] text-zinc-600 truncate mt-0.5">{member.email}</p>
        </div>
      </div>

      <div>
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${roleCfg.badge}`}>
          <roleCfg.icon className={`size-3 ${roleCfg.iconClass}`} />
          {member.role}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${member.online ? "bg-emerald-500" : "bg-zinc-600"}`} />
        <span className={`text-xs ${member.online ? "text-emerald-400" : "text-zinc-600"}`}>{member.online ? "Online" : "Offline"}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <AlertTriangle className="size-3 shrink-0" />
        <span>{member.incidentsResponded}</span>
      </div>

      <div>
        {!isCurrentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors outline-none">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={dropdownContentClass}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-zinc-500 text-[11px]">Change Role</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={member.role} onValueChange={(val) => onRoleChange(member.id, val)}>
                  {ROLES.map((r) => {
                    const RoleIcon = roleConfig[r].icon;
                    return (
                      <DropdownMenuRadioItem key={r} value={r} className="gap-2 text-xs">
                        <RoleIcon className={`size-3 ${roleConfig[r].iconClass}`} />
                        {r}
                      </DropdownMenuRadioItem>
                    );
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="gap-2 text-xs text-red-400 focus:text-red-300 focus:bg-red-950/40 cursor-pointer" onClick={() => onRemove(member.id)}>
                <Trash2 className="size-3.5" />
                Remove from team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : <div className="w-7" />}
      </div>
    </div>
  );
}

function RoleLegendCard({ role }) {
  const cfg = roleConfig[role];
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
          <cfg.icon className={`size-3.5 ${cfg.iconClass}`} />
        </div>
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>{role}</span>
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{cfg.description}</p>
      <ul className="flex flex-col gap-1.5">
        {cfg.can.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[11px] text-zinc-600">
            <Check className="size-3 text-zinc-700 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InviteSheet({ open, onOpenChange, onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Responder");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite({ email: email.trim(), role: role.toLowerCase() });
    setEmail("");
    setRole("Responder");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-zinc-100">Invite Team Member</SheetTitle>
          <SheetDescription className="text-zinc-400">Send an invite link to a new member.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@acme.com" className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Role</label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => {
                const cfg = roleConfig[r];
                const selected = role === r;
                return (
                  <button key={r} type="button" onClick={() => setRole(r)} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${selected ? "border-zinc-600 bg-zinc-800" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 mt-0.5">
                      <cfg.icon className={`size-3.5 ${cfg.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">{r}</span>
                        {selected && <Check className="size-3.5 text-emerald-500 ml-auto" />}
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{cfg.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
            <Mail className="size-4" />
            Send Invite
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamApi.getMembers();
      setMembers((data.members || []).map(normalizeMember));
    } catch (err) {
      console.error("Failed to fetch team members", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const stats = useMemo(() => ({
    total: members.length,
    online: members.filter((m) => m.online).length,
    admins: members.filter((m) => m.role === "Admin").length,
    responders: members.filter((m) => m.role === "Responder").length,
    viewers: members.filter((m) => m.role === "Viewer").length,
  }), [members]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await teamApi.updateRole(id, newRole.toLowerCase());
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await teamApi.removeMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  const handleInvite = async ({ email, role }) => {
    try {
      await teamApi.invite(email, role);
      // We don't have a "pending invites" list in this UI connected to real backend yet, 
      // but we could refresh if needed.
    } catch (err) {
      console.error("Failed to invite member", err);
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Team</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage members, roles, and access</p>
        </div>
        <button type="button" onClick={() => setInviteOpen(true)} className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 transition-colors">
          <UserPlus className="size-4" />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Members", value: stats.total, sub: `${stats.online} online now`, color: "text-zinc-100" },
          { label: "Admins", value: stats.admins, sub: "full access", color: "text-violet-400" },
          { label: "Responders", value: stats.responders, sub: "can manage incidents", color: "text-blue-400" },
          { label: "Viewers", value: stats.viewers, sub: "read-only access", color: "text-zinc-500" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-4">
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs font-medium text-zinc-300 mt-1">{label}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Members</h2>
          <span className="text-[11px] text-zinc-600">{members.length} total</span>
        </div>

        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-zinc-800 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
          <span>Member</span>
          <span>Role</span>
          <span>Status</span>
          <span className="flex items-center gap-1"><AlertTriangle className="size-3" /> Incidents</span>
          <span className="sr-only">Actions</span>
        </div>

        <div className="px-5">
          {loading ? <div className="py-8 text-center text-zinc-600 text-sm italic">Loading team...</div> :
           members.length === 0 ? <div className="py-8 text-center text-zinc-600 text-sm italic">No members found</div> :
           members.map((member) => (
            <MemberRow key={member.id} member={member} onRoleChange={handleRoleChange} onRemove={handleRemove} isCurrentUser={false} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserCog className="size-4 text-zinc-600" />
          <h2 className="text-sm font-semibold text-zinc-300">Role Permissions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map((role) => <RoleLegendCard key={role} role={role} />)}
        </div>
      </div>

      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} onInvite={handleInvite} />
    </div>
  );
}
