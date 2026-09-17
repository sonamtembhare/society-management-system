"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import { setUser, logout } from "@/src/store/authSlice";
import { getMe } from "@/src/services/auth.service";
import Sidebar from "@/src/components/Sidebar/Sidebar";
import Navbar from "@/src/components/Navbar/Navbar";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, loading } = useSelector(
    (state: RootState) => state.auth
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!isAuthenticated && !loading) {
      getMe()
        .then((data) => {
          dispatch(setUser(data));
        })
        .catch(() => {
          localStorage.removeItem("token");
          dispatch(logout());
          router.replace("/login");
        });
    }
  }, [isAuthenticated, loading, dispatch, router]);

  if (!mounted || loading || !isAuthenticated) {
    return (
      <div className={styles.loading}>Loading...</div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        role={user?.role || "RESIDENT"}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={pathname}
      />
      <div className={styles.main}>
        <Navbar
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={() => {
            localStorage.removeItem("token");
            dispatch(logout());
            router.replace("/login");
          }}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
