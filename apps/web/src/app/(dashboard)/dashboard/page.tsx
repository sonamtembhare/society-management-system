"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { ResidentDetail } from "@/src/types";
import { getOwnProfile } from "@/src/services/resident.service";
import Loader from "@/src/components/Loader/Loader";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { user, role } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "RESIDENT") {
      getOwnProfile()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [role]);

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  const adminCards = [
    { label: "Residents", href: "/residents", icon: "👥" },
    { label: "Vehicles", href: "/vehicles", icon: "🚗" },
    { label: "Maintenance", href: "/maintenance", icon: "🔧" },
    { label: "Complaints", href: "/complaints", icon: "📋" },
    { label: "Notices", href: "/notices", icon: "📢" },
    { label: "Visitors", href: "/visitors", icon: "🚶" },
    { label: "Flats", href: "/flats", icon: "🏠" },
    { label: "Events", href: "/events", icon: "📅" },
  ];

  const residentCards = [
    { label: "My Vehicles", href: "/vehicles", icon: "🚗" },
    { label: "Maintenance", href: "/maintenance", icon: "🔧" },
    { label: "Complaints", href: "/complaints", icon: "📋" },
    { label: "Notices", href: "/notices", icon: "📢" },
    { label: "Visitors", href: "/visitors", icon: "🚶" },
    { label: "Events", href: "/events", icon: "📅" },
  ];

  const securityCards = [
    { label: "Visitors", href: "/visitors", icon: "🚶" },
    { label: "Vehicles", href: "/vehicles", icon: "🚗" },
  ];

  const cards = role === "ADMIN" ? adminCards : role === "SECURITY" ? securityCards : residentCards;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.name}</h1>
        <span className={styles.badge}>{role}</span>
      </div>

      {role === "RESIDENT" && profile && (
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Flat</div>
            <div className={styles.infoValue}>{profile.flat_number || "-"}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Phone</div>
            <div className={styles.infoValue}>{profile.phone || "-"}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Society</div>
            <div className={styles.infoValue}>{profile.society_name || "-"}</div>
          </div>
          {profile.vehicles && profile.vehicles.length > 0 && (
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Vehicles</div>
              <div className={styles.infoValue}>{profile.vehicles.length} registered</div>
            </div>
          )}
        </div>
      )}

      <div className={styles.grid}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={styles.card}>
            <span className={styles.cardIcon}>{card.icon}</span>
            <span className={styles.cardLabel}>{card.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
