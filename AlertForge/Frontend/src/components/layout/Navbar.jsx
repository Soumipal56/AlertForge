import { DropdownNavigation } from "@/components/ui/dorpdown-navigation";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import {
  Cpu,
  Globe,
  Eye,
  Shield,
  Rocket,
  Box,
  Search,
  Palette,
  BookOpen,
  FileText,
  Newspaper,
} from "lucide-react";

function Navbar() {
  const NAV_ITEMS = [
    {
      id: 1,
      label: "Products",
      subMenus: [
        {
          title: "DX Platform",
          items: [
            {
              label: "Previews",
              description: "Helping teams ship 6× faster",
              icon: Cpu,
            },
            {
              label: "AI",
              description: "Powering breakthroughs",
              icon: Search,
            },
          ],
        },
        {
          title: "Managed Infrastructure",
          items: [
            {
              label: "Rendering",
              description: "Fast, scalable, and reliable",
              icon: Globe,
            },
            {
              label: "Observability",
              description: "Trace every step",
              icon: Eye,
            },
            {
              label: "Security",
              description: "Scale without compromising",
              icon: Shield,
            },
          ],
        },
        {
          title: "Open Source",
          items: [
            {
              label: "Next.js",
              description: "The native Next.js platform",
              icon: Rocket,
            },
            {
              label: "Turborepo",
              description: "Speed with Enterprise scale",
              icon: Box,
            },
            {
              label: "AI SDK",
              description: "The AI Toolkit for TypeScript",
              icon: Palette,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      label: "Solutions",
      subMenus: [
        {
          title: "Use Cases",
          items: [
            {
              label: "AI Apps",
              description: "Deploy at the speed of AI",
              icon: Cpu,
            },
            {
              label: "Composable Commerce",
              description: "Power storefronts that convert",
              icon: Box,
            },
            {
              label: "Marketing Sites",
              description: "Launch campaigns fast",
              icon: Rocket,
            },
            {
              label: "Multi-tenant Platforms",
              description: "Scale apps with one codebase",
              icon: Globe,
            },
            {
              label: "Web Apps",
              description: "Ship features, not infrastructure",
              icon: Search,
            },
          ],
        },
        {
          title: "Users",
          items: [
            {
              label: "Platform Engineers",
              description: "Automate away repetition",
              icon: Cpu,
            },
            {
              label: "Design Engineers",
              description: "Deploy for every idea",
              icon: Palette,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      label: "Resources",
      subMenus: [
        {
          title: "Tools",
          items: [
            {
              label: "Resource Center",
              description: "Today's best practices",
              icon: BookOpen,
            },
            {
              label: "Marketplace",
              description: "Extend and automate workflows",
              icon: Search,
            },
            {
              label: "Templates",
              description: "Jumpstart app development",
              icon: FileText,
            },
            {
              label: "Guides",
              description: "Find help quickly",
              icon: BookOpen,
            },
          ],
        },
        {
          title: "Company",
          items: [
            {
              label: "Customers",
              description: "Trusted by the best teams",
              icon: Newspaper,
            },
            {
              label: "Blog",
              description: "The latest posts and changes",
              icon: FileText,
            },
            {
              label: "Changelog",
              description: "See what shipped",
              icon: BookOpen,
            },
            {
              label: "Press",
              description: "Read the latest news",
              icon: Newspaper,
            },
          ],
        },
      ],
    },
    { id: 5, label: "Docs", link: "#" },
  ];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 lg:px-16 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-zinc-950/80 border border-zinc-800/60 backdrop-blur-xl rounded-2xl px-5 py-2">
        {/* LEFT — Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">
            AlertForge
          </span>
        </a>

        {/* CENTER — Nav links */}
        <div className="hidden md:flex items-center">
          <DropdownNavigation navItems={NAV_ITEMS} />
        </div>

        {/* RIGHT — Auth buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <a
            href="/login"
            className="text-zinc-400 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-white/[0.06] transition-all duration-200 font-medium"
          >
            Log in
          </a>
          <a
            href="/register"
            className="text-sm px-4 py-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition-all duration-200 font-semibold"
          >
            Sign up
          </a>
        </div>
        <button
          className="md:hidden text-zinc-400 hover:text-white transition-colors p-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 bg-zinc-950/95 border border-zinc-800/60 backdrop-blur-xl rounded-2xl px-5 py-4 flex flex-col gap-1">
          {[
            "Products",
            "Solutions",
            "Resources",
            "Enterprise",
            "Docs",
            "Pricing",
          ].map((link) => (
            <a
              key={link}
              href="#"
              className="text-zinc-400 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
            >
              {link}
            </a>
          ))}
          <div className="border-t border-zinc-800 mt-2 pt-3 flex flex-col gap-2">
            <a
              href="/login"
              className="text-zinc-300 text-sm px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200 font-medium"
            >
              Log in
            </a>
            <a
              href="/register"
              className="text-sm px-3 py-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-center"
            >
              Sign up
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export { Navbar };
