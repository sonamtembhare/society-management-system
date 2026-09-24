import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { visitorService } from "../../services";
import type { Visitor } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { formatDateTime } from "../../utils";

export function VisitorListScreen() {
  const { user } = useAuth();
  const isSecurity = user?.role === "SECURITY";
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await visitorService.getVisitors();
      if (res.success && res.data) setVisitors(res.data as Visitor[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleCheckIn = async (visitor: Visitor) => {
    try {
      await visitorService.checkInVisitor(visitor.id);
      Alert.alert("Success", `${visitor.visitor_name} checked in`);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (visitor: Visitor) => {
    try {
      await visitorService.checkOutVisitor(visitor.id);
      Alert.alert("Success", `${visitor.visitor_name} checked out`);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to check out");
    }
  };

  const renderSecurityActions = (item: Visitor) => {
    if (["EXPECTED", "APPROVED", "PENDING"].includes(item.status)) {
      return (
        <View style={styles.actionsRow}>
          <Button title="Check In" onPress={() => handleCheckIn(item)} style={styles.actionButton} />
        </View>
      );
    }
    if (item.status === "CHECKED_IN") {
      return (
        <View style={styles.actionsRow}>
          <Button title="Check Out" variant="secondary" onPress={() => handleCheckOut(item)} style={styles.actionButton} />
        </View>
      );
    }
    return null;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={visitors}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          isSecurity ? (
            <View style={styles.header}>
              <Button title="Add Visitor" onPress={() => router.push("/visitor/create")} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/visitor/${item.id}`)}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.visitor_name}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || Colors.gray400 }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.detail}>{item.visitor_type} | {item.purpose || "N/A"}</Text>
            <Text style={styles.detail}>Phone: {item.visitor_phone}</Text>
            <Text style={styles.detail}>
              {item.resident_name || "—"} | Flat {item.flat_number || "—"}
            </Text>
            {item.check_in_time && <Text style={styles.detail}>In: {formatDateTime(item.check_in_time)}</Text>}
            {item.check_out_time && <Text style={styles.detail}>Out: {formatDateTime(item.check_out_time)}</Text>}
            {isSecurity ? (
              <View style={styles.actionsWrap}>{renderSecurityActions(item)}</View>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No visitors found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  actionsWrap: { marginTop: Spacing.sm },
  actionsRow: { flexDirection: "row", gap: Spacing.md },
  actionButton: { flex: 1, minHeight: 40 },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});