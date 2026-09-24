import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { visitorService } from "../../services";
import type { Visitor } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { formatDateTime } from "../../utils";

export function VisitorDetailScreen({ id }: { id: number }) {
  const { user } = useAuth();
  const isSecurity = user?.role === "SECURITY";
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await visitorService.getVisitorById(id);
      if (res.success && res.data) setVisitor(res.data as Visitor);
    } catch {} finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCheckIn = async () => {
    try {
      await visitorService.checkInVisitor(id);
      Alert.alert("Success", "Visitor checked in");
      load();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await visitorService.checkOutVisitor(id);
      Alert.alert("Success", "Visitor checked out");
      load();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to check out");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!visitor) return <View style={styles.container}><Text style={styles.empty}>Visitor not found</Text></View>;

  const showCheckIn = ["EXPECTED", "APPROVED", "PENDING"].includes(visitor.status);
  const showCheckOut = visitor.status === "CHECKED_IN";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{visitor.visitor_name}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[visitor.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{visitor.status}</Text>
          </View>
        </View>
        <Text style={styles.detail}>Phone: {visitor.visitor_phone}</Text>
        <Text style={styles.detail}>Type: {visitor.visitor_type}</Text>
        <Text style={styles.detail}>Purpose: {visitor.purpose || "N/A"}</Text>
        <Text style={styles.detail}>Vehicle: {visitor.vehicle_number || "N/A"}</Text>
        <View style={styles.divider} />
        <Text style={styles.detail}>Resident: {visitor.resident_name || "N/A"}</Text>
        <Text style={styles.detail}>Flat: {visitor.flat_number || "N/A"}</Text>
        {visitor.expected_date && <Text style={styles.detail}>Expected: {visitor.expected_date} {visitor.expected_time || ""}</Text>}
        {visitor.check_in_time && <Text style={styles.detail}>Check In: {formatDateTime(visitor.check_in_time)}</Text>}
        {visitor.check_out_time && <Text style={styles.detail}>Check Out: {formatDateTime(visitor.check_out_time)}</Text>}
        {visitor.notes && <Text style={styles.notes}>Notes: {visitor.notes}</Text>}
      </View>
      {isSecurity && (showCheckIn || showCheckOut) && (
        <View style={styles.actionsRow}>
          {showCheckIn && <Button title="Check In" onPress={handleCheckIn} style={styles.actionButton} />}
          {showCheckOut && <Button title="Check Out" variant="secondary" onPress={handleCheckOut} style={styles.actionButton} />}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  detail: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  notes: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md, fontStyle: "italic" },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  actionsRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  actionButton: { flex: 1 },
});