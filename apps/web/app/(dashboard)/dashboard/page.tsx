"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { getResidents } from "@/src/services/resident.service";
import { getFlats } from "@/src/services/flat.service";
import { getMaintenance } from "@/src/services/maintenance.service";
import { getComplaints } from "@/src/services/complaint.service";
import { getVisitors } from "@/src/services/visitor.service";
import { Resident } from "@/src/types/resident";
import { Flat } from "@/src/types/flat";
import { Maintenance } from "@/src/types/maintenance";
import { Complaint } from "@/src/types/complaint";
import { Visitor } from "@/src/types/visitor";
import Loader from "@/src/components/Loader/Loader";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [r, f, m, c, v] = await Promise.allSettled([
          getResidents(),
          getFlats(),
          getMaintenance(),
          getComplaints(),
          getVisitors(),
        ]);
        if (r.status === "fulfilled") setResidents(r.value);
        if (f.status === "fulfilled") setFlats(f.value);
        if (m.status === "fulfilled") setMaintenance(m.value);
        if (c.status === "fulfilled") setComplaints(c.value);
        if (v.status === "fulfilled") setVisitors(v.value);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Loader />;

  const pendingMaintenance = maintenance.filter((m) => m.status === "PENDING").length;
  const openComplaints = complaints.filter((c) => c.status === "PENDING" || c.status === "IN_PROGRESS").length;
  const today = new Date().toISOString().split("T")[0] ?? "";
  const visitorsToday = visitors.filter((v) => v.created_at?.startsWith(today)).length;

  const stats = [
    { label: "Total Residents", value: residents.length, color: "var(--color-primary)" },
    { label: "Total Flats", value: flats.length, color: "var(--color-success)" },
    { label: "Pending Maintenance", value: pendingMaintenance, color: "var(--color-warning)" },
    { label: "Open Complaints", value: openComplaints, color: "var(--color-danger)" },
    { label: "Visitors Today", value: visitorsToday, color: "var(--color-info)" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back, {user?.name ?? "User"}</p>
      </div>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.card}>
            <div className={styles.cardLabel}>{stat.label}</div>
            <div className={styles.cardValue} style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
