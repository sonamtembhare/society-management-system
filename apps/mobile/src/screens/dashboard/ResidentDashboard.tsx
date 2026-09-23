import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";

export function ResidentDashboard() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>Welcome, {user?.name}</Text>
      <Text style={styles.subtitle}>Resident Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>--</Text>
          <Text style={styles.statLabel}>Pending Maintenance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
          <Text style={[styles.statNumber, { color: Colors.warning }]}>--</Text>
          <Text style={styles.statLabel}>Open Complaints</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>--</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.infoLight }]}>
          <Text style={[styles.statNumber, { color: Colors.info }]}>--</Text>
          <Text style={styles.statLabel}>Visitors Today</Text>
        </View>
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
  statNumber: { fontSize: FontSize.xxxl, fontWeight: "bold" },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
});
