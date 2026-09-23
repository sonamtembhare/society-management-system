import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { router } from "expo-router";
import { vehicleService } from "../../services";
import type { Vehicle } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export function VehicleListScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await vehicleService.getVehicles();
      if (res.success && res.data) setVehicles(res.data as Vehicle[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/vehicle/${item.id}`)}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.vehicle_number}</Text>
              <Text style={styles.type}>{item.vehicle_type}</Text>
            </View>
            <Text style={styles.detail}>{item.brand || ""} {item.model || ""} | {item.color || "N/A"}</Text>
            <Text style={styles.detail}>Owner: {item.resident_name || "N/A"}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No vehicles found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  type: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "600" },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});
