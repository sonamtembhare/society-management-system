import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { vehicleService } from "../../services";
import type { Vehicle } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export function VehicleDetailScreen({ id }: { id: number }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await vehicleService.getVehicleById(id);
        if (res.success && res.data) setVehicle(res.data as Vehicle);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!vehicle) return <View style={styles.container}><Text style={styles.empty}>Vehicle not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{vehicle.vehicle_number}</Text>
        <Text style={styles.detail}>Type: {vehicle.vehicle_type}</Text>
        <Text style={styles.detail}>Brand: {vehicle.brand || "N/A"}</Text>
        <Text style={styles.detail}>Model: {vehicle.model || "N/A"}</Text>
        <Text style={styles.detail}>Color: {vehicle.color || "N/A"}</Text>
        <Text style={styles.detail}>Status: {vehicle.status}</Text>
        <Text style={styles.detail}>Owner: {vehicle.resident_name || "N/A"}</Text>
        <Text style={styles.detail}>Flat: {vehicle.flat_number || "N/A"}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  detail: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});
