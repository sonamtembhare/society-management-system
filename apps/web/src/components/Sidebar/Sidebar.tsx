"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

const adminMenu = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Society", href: "/society", icon: "🏢" },
  { label: "Flats", href: "/flats", icon: "🏠" },
  { label: "Residents", href: "/residents", icon: "👥" },
  { label: "Maintenance", href: "/maintenance", icon: "🔧" },
  { label: "Payments", href: "/payments", icon: "💰" },
  { label: "Complaints", href: "/complaints", icon: "📋" },
  { label: "Notices", href: "/notices", icon: "📢" },
  { label: "Visitors", href: "/visitors", icon: "🚶" },
  { label: "Vehicles", href: "/vehicles", icon: "🚗" },
  { label: "Events", href: "/events", icon: "📅" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

const residentMenu = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Maintenance", href: "/maintenance", icon: "🔧" },
  { label: "Payments", href: "/payments", icon: "💰" },
  { label: "Complaints", href: "/complaints", icon: "📋" },
  { label: "Notices", href: "/notices", icon: "📢" },
  { label: "Visitors", href: "/visitors", icon: "🚶" },
  { label: "Vehicles", href: "/vehicles", icon: "🚗" },
  { label: "Events", href: "/events", icon: "📅" },
];

const securityMenu = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Visitors", href: "/visitors", icon: "🚶" },
  { label: "Vehicles", href: "/vehicles", icon: "🚗" },
];

const menuByRole: Record<string, typeof adminMenu> = {
  ADMIN: adminMenu,
  RESIDENT: residentMenu,
  SECURITY: securityMenu,
};

export default function Sidebar({ role, isOpen, onClose, currentPath }: SidebarProps) {
  const menu = menuByRole[role] || residentMenu;

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Society Mgmt</h1>
        </div>
        <nav className={styles.nav}>
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${currentPath === item.href ? styles.active : ""}`}
              onClick={onClose}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
