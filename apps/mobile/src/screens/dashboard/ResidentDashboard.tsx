import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { maintenanceService, complaintService, vehicleService, visitorService } from "../../services";
import type { Maintenance, Complaint, Vehicle, Visitor } from "../../types";

interface Stats {
  pendingMaintenance: number;
  openComplaints: number;
  vehicles: number;
  visitorsToday: number;
  unpaidBills: Maintenance[];
}

export function ResidentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const [maintenanceRes, complaintsRes, vehiclesRes, visitorsRes] = await Promise.all([
        maintenanceService.getMaintenance().catch(() => null),
        complaintService.getComplaints().catch(() => null),
        vehicleService.getVehicles().catch(() => null),
        visitorService.getVisitors().catch(() => null),
      ]);

      const maintenance = (maintenanceRes?.success && maintenanceRes.data) ? (maintenanceRes.data as Maintenance[]) : [];
      const complaints = (complaintsRes?.success && complaintsRes.data) ? (complaintsRes.data as Complaint[]) : [];
      const vehicles = (vehiclesRes?.success && vehiclesRes.data) ? (vehiclesRes.data as Vehicle[]) : [];
      const visitors = (visitorsRes?.success && visitorsRes.data) ? (visitorsRes.data as Visitor[]) : [];

      const today = new Date().toISOString().split("T")[0];
      const unpaidBills = maintenance.filter(
        (bill) => bill.status !== "PAID" && bill.status !== "CANCELLED"
      );
      const visitorsToday = visitors.filter(
        (v) => v.expected_date?.startsWith(today) || v.check_in_time?.startsWith(today)
      ).length;

      setStats({
        pendingMaintenance: unpaidBills.length,
        openComplaints: complaints.filter(
          (c) => c.status === "PENDING" || c.status === "IN_PROGRESS"
        ).length,
        vehicles: vehicles.length,
        visitorsToday,
        unpaidBills,
      });
    } catch {
      setStats((prev) => prev ?? { pendingMaintenance: 0, openComplaints: 0, vehicles: 0, visitorsToday: 0, unpaidBills: [] });
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

  const handlePayMaintenance = () => {
    if (stats?.unpaidBills?.length) {
      router.push(`/maintenance/${stats.unpaidBills[0].id}`);
    } else {
      router.push("/_tabs/maintenance");
    }
  };

  const statCards = [
    {
      label: "Pending Maintenance",
      value: stats?.pendingMaintenance ?? 0,
      backgroundColor: Colors.warningLight,
      color: Colors.warning,
      icon: "receipt" as const,
      onPress: handlePayMaintenance,
    },
    {
      label: "Open Complaints",
      value: stats?.openComplaints ?? 0,
      backgroundColor: Colors.dangerLight,
      color: Colors.danger,
      icon: "alert-circle" as const,
      onPress: () => router.push("/_tabs/complaints"),
    },
    {
      label: "My Vehicles",
      value: stats?.vehicles ?? 0,
      backgroundColor: Colors.successLight,
      color: Colors.success,
      icon: "car-sport" as const,
      onPress: () => router.push("/_tabs/vehicles"),
    },
    {
      label: "Visitors Today",
      value: stats?.visitorsToday ?? 0,
      backgroundColor: Colors.infoLight,
      color: Colors.info,
      icon: "people" as const,
      onPress: () => router.push("/_tabs/visitors"),
    },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>Welcome, {user?.name}</Text>
      <Text style={styles.subtitle}>Resident Dashboard</Text>

      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <TouchableOpacity
            key={card.label}
            style={[styles.statCard, { backgroundColor: card.backgroundColor }]}
            onPress={card.onPress}
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
