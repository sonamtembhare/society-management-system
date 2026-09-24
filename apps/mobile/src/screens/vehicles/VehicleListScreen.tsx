import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { vehicleService } from "../../services";
import type { Vehicle } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { formatDateTime } from "../../utils";

export function VehicleListScreen() {
  const { user } = useAuth();
  const isResident = user?.role === "RESIDENT";
  const isSecurity = user?.role === "SECURITY";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await vehicleService.getVehicles();
      if (res.success && res.data) setVehicles(res.data as Vehicle[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleRecord = async (vehicle: Vehicle, type: "entry" | "exit") => {
    try {
      if (type === "entry") {
        await vehicleService.recordEntry(vehicle.id);
        Alert.alert("Success", "Vehicle entry recorded");
      } else {
        await vehicleService.recordExit(vehicle.id);
        Alert.alert("Success", "Vehicle exit recorded");
      }
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to record ${type}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  const renderTimes = (item: Vehicle) => (
    <View style={styles.timesRow}>
      <Text style={styles.time}>
        <Text style={styles.timeLabel}>In: </Text>
        {item.last_entry_at ? formatDateTime(item.last_entry_at) : "—"}
      </Text>
      <Text style={styles.time}>
        <Text style={styles.timeLabel}>Out: </Text>
        {item.last_exit_at ? formatDateTime(item.last_exit_at) : "—"}
      </Text>
    </View>
  );

  const renderSecurityActions = (item: Vehicle) => (
    <View style={styles.actionsRow}>
      <Button title="Entry" onPress={() => handleRecord(item, "entry")} style={styles.actionButton} />
      <Button title="Exit" variant="secondary" onPress={() => handleRecord(item, "exit")} style={styles.actionButton} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          isResident || isSecurity ? (
            <View style={styles.header}>
              <Button title="Add Vehicle" onPress={() => router.push("/vehicle/create")} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/vehicle/${item.id}`)}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.vehicle_number}</Text>
              <Text style={styles.type}>{item.vehicle_type}</Text>
            </View>
            <Text style={styles.detail}>{item.brand || ""} {item.model || ""} | {item.color || "N/A"}</Text>
            {isSecurity ? (
              <>
                <Text style={styles.detail}>Owner: {item.resident_name || "N/A"} | Flat: {item.flat_number || "N/A"}</Text>
                <Text style={styles.detail}>Status: {item.status}</Text>
                {renderTimes(item)}
                {renderSecurityActions(item)}
              </>
            ) : (
              <Text style={styles.detail}>Owner: {item.resident_name || "N/A"}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No vehicles found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  type: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "600" },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  timesRow: { marginTop: Spacing.sm, gap: 2 },
  time: { fontSize: FontSize.sm, color: Colors.textSecondary },
  timeLabel: { color: Colors.gray500, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  actionButton: { flex: 1, minHeight: 40 },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});