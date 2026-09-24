import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { complaintService } from "../../services";
import type { Complaint } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { formatDate } from "../../utils";
import { Button } from "../../components/ui/Button";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export function ComplaintListScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await complaintService.getComplaints();
      if (res.success && res.data) setComplaints(res.data as Complaint[]);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDelete = (item: Complaint) => {
    Alert.alert("Delete Complaint", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await complaintService.deleteComplaint(item.id);
            setComplaints((prev) => prev.filter((c) => c.id !== item.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete complaint");
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  const isResident = user?.role === "RESIDENT";

  return (
    <View style={styles.container}>
      <FlatList
        data={complaints}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/complaint/${item.id}`)}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || Colors.gray400 }]}>
                  <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.detail}>#{item.id} | {item.category || "No category"}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.priority] || Colors.gray400 }]}>
                  <Text style={styles.badgeText}>{PRIORITY_LABELS[item.priority] || item.priority}</Text>
                </View>
              </View>
              <Text style={styles.detail}>
                {isAdmin ? `${item.resident_name || "Resident"} | ${item.flat_number || "Flat N/A"}` : "Added "}
                {formatDate(item.created_at)}
              </Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)} accessibilityLabel="Delete complaint">
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No complaints found</Text>}
      />
      {isResident && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push("/complaint/create")} accessibilityLabel="Create new complaint">
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  cardBody: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  deleteButton: { paddingLeft: Spacing.md, paddingVertical: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});