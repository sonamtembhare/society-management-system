import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { residentService } from "../../services";
import type { Resident } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";

export function ResidentListScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await residentService.getResidents();
      if (res.success && res.data) setResidents(res.data as Resident[]);
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

  const handleDelete = (item: Resident) => {
    Alert.alert("Delete Resident", `Remove ${item.user_name || "this resident"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await residentService.deleteResident(item.id);
            setResidents((prev) => prev.filter((r) => r.id !== item.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete resident");
          }
        },
      },
    ]);
  };

  const header = isAdmin ? (
    <View style={styles.headerActions}>
      <Button title="Add Resident" onPress={() => router.push("/resident/create")} />
    </View>
  ) : null;

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={residents}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/resident/${item.id}`)}>
              <Text style={styles.name}>{item.user_name || "Resident"}</Text>
              <Text style={styles.detail}>Flat: {item.flat_number || "--"} | {item.user_email || ""}</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)} accessibilityLabel="Delete resident">
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No residents found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerActions: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
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
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  deleteButton: { paddingLeft: Spacing.md, paddingVertical: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl, fontSize: FontSize.md },
});