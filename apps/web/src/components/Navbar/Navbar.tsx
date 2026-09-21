"use client";

import styles from "./Navbar.module.css";
import { User } from "@/src/types";

interface NavbarProps {
  user: User | null;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onMenuClick, onLogout }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <button className={styles.menuBtn} onClick={onMenuClick}>
        &#9776;
      </button>
      <div className={styles.right}>
        <div className={styles.user}>
          <span className={styles.name}>{user?.name}</span>
          {user?.phone && <span className={styles.phone}>{user.phone}</span>}
          <span className={styles.role}>{user?.role}</span>
        </div>
        <button className={styles.logout} onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
