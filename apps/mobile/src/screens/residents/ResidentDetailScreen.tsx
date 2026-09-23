import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { residentService } from "../../services";
import type { ResidentDetail } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export function ResidentDetailScreen({ id }: { id: number }) {
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await residentService.getResidentById(id);
        if (res.success && res.data) setResident(res.data as ResidentDetail);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!resident) return <View style={styles.container}><Text style={styles.empty}>Resident not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{resident.user_name}</Text>
        <Text style={styles.detail}>Email: {resident.user_email}</Text>
        <Text style={styles.detail}>Phone: {resident.phone || "N/A"}</Text>
        <Text style={styles.detail}>Flat: {resident.flat_number} ({resident.block || "N/A"})</Text>
        <Text style={styles.detail}>Society: {resident.society_name}</Text>
        <Text style={styles.detail}>Emergency: {resident.emergency_contact || "N/A"}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  name: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  detail: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});
