import { NavLink, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import LanguageSwitcher from "../ui/LanguageSwitcher";

interface NavItem {
  to: string;
  labelKey: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    to: "/dashboard/products",
    labelKey: "nav.products",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/dashboard/users",
    labelKey: "nav.users",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/dashboard/orders",
    labelKey: "nav.orders",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 14l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

interface SidebarProps {
  onLogout: () => void;
}

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

export default function Sidebar({ onLogout }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-forest-800 bg-forest-900 text-slate-300">
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/products" className="flex select-none items-center gap-3 text-brand-300">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.5" fill="rgba(16,185,129,0.2)" />
            <path d="M12 2v20M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-white">{t("common.brand")}</span>
            <span className="text-xs text-slate-400">{t("nav.adminPanel")}</span>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <span className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("nav.management")}
        </span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.icon}
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 px-3 py-4">
        <div className="px-3 pb-2">
          <LanguageSwitcher tone="dark" />
        </div>
        <Link to="/products" className={`${linkBase} text-slate-300 hover:bg-white/5 hover:text-white`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("common.backToStore")}
        </Link>
        <button
          onClick={onLogout}
          className={`${linkBase} text-red-300 hover:bg-red-500/10 hover:text-red-200`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
