import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { residentService, flatService, maintenanceService, complaintService } from "../../services";
import type { Resident, Flat, Maintenance, Complaint } from "../../types";

interface Stats {
  totalResidents: number;
  totalFlats: number;
  pendingMaintenance: number;
  openComplaints: number;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const [residentsRes, flatsRes, maintenanceRes, complaintsRes] = await Promise.all([
        residentService.getResidents().catch(() => null),
        flatService.getFlats().catch(() => null),
        maintenanceService.getMaintenance().catch(() => null),
        complaintService.getComplaints().catch(() => null),
      ]);

      const residents = (residentsRes?.success && residentsRes.data) ? (residentsRes.data as Resident[]) : [];
      const flats = (flatsRes?.success && flatsRes.data) ? (flatsRes.data as Flat[]) : [];
      const maintenance = (maintenanceRes?.success && maintenanceRes.data) ? (maintenanceRes.data as Maintenance[]) : [];
      const complaints = (complaintsRes?.success && complaintsRes.data) ? (complaintsRes.data as Complaint[]) : [];

      setStats({
        totalResidents: residents.length,
        totalFlats: flats.length,
        pendingMaintenance: maintenance.filter(
          (bill) => bill.status !== "PAID" && bill.status !== "CANCELLED"
        ).length,
        openComplaints: complaints.filter(
          (c) => c.status === "PENDING" || c.status === "IN_PROGRESS"
        ).length,
      });
    } catch {
      setStats((prev) => prev ?? { totalResidents: 0, totalFlats: 0, pendingMaintenance: 0, openComplaints: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats(stats === null);
    }, [fetchStats, stats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats(false);
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      label: "Total Residents",
      value: stats?.totalResidents ?? 0,
      backgroundColor: Colors.primaryLight,
      color: Colors.primary,
      route: "/_tabs/residents" as const,
      icon: "people" as const,
    },
    {
      label: "Total Flats",
      value: stats?.totalFlats ?? 0,
      backgroundColor: Colors.successLight,
      color: Colors.success,
      route: "/_tabs/flats" as const,
      icon: "business" as const,
    },
    {
      label: "Pending Maintenance",
      value: stats?.pendingMaintenance ?? 0,
      backgroundColor: Colors.warningLight,
      color: Colors.warning,
      route: "/_tabs/maintenance" as const,
      icon: "receipt" as const,
    },
    {
      label: "Open Complaints",
      value: stats?.openComplaints ?? 0,
      backgroundColor: Colors.dangerLight,
      color: Colors.danger,
      route: "/_tabs/complaints" as const,
      icon: "alert-circle" as const,
    },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>Welcome, {user?.name}</Text>
      <Text style={styles.subtitle}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <TouchableOpacity
            key={card.label}
            style={[styles.statCard, { backgroundColor: card.backgroundColor }]}
            onPress={() => router.push(card.route)}
            activeOpacity={0.7}
          >
            <View style={styles.statCardHeader}>
              <Text style={[styles.statNumber, { color: card.color }]}>{card.value}</Text>
              <Ionicons name={card.icon} size={18} color={card.color} style={styles.statIcon} />
            </View>
            <Text style={styles.statLabel}>{card.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  greeting: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  statCard: { width: "48%", padding: Spacing.lg, borderRadius: BorderRadius.lg, ...Shadow.md },
  statCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statNumber: { fontSize: FontSize.xxxl, fontWeight: "bold" },
  statIcon: { marginTop: Spacing.xs },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
});