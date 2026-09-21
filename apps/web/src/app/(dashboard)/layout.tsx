"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/src/components/ProtectedRoute/ProtectedRoute";
import Navbar from "@/src/components/Navbar/Navbar";
import Sidebar from "@/src/components/Sidebar/Sidebar";
import { RootState } from "@/src/store";
import { logout } from "@/src/store/authSlice";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, role } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <Navbar
        user={user}
        onMenuClick={() => setSidebarOpen(true)}
        onLogout={handleLogout}
      />
      <Sidebar
        role={role || "RESIDENT"}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={pathname}
      />
      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          marginTop: "var(--navbar-height)",
          padding: "24px",
          minHeight: "calc(100vh - var(--navbar-height))",
        }}
      >
        {children}
      </main>
    </ProtectedRoute>
  );
}
