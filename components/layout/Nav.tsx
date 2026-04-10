"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, List, BarChart2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/log", label: "Log", icon: List },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 md:static md:flex md:flex-col md:border-t-0 md:border-r md:w-16 md:min-h-screen md:pt-6">
      <ul className="flex md:flex-col justify-around md:justify-start md:gap-2 md:px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                title={label}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-3 rounded-lg text-xs font-medium transition-colors
                  ${active
                    ? "text-orange-400 bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="md:hidden">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="hidden md:flex md:flex-col md:mt-auto md:mb-4 md:px-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("taskpotato:shortcuts-help"))}
          title="Keyboard shortcuts (?)"
          className="flex flex-col items-center px-3 py-3 rounded-lg text-xs text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
        >
          <span className="text-base font-mono">?</span>
        </button>
      </div>
    </nav>
  );
}
