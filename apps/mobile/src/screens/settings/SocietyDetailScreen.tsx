import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { societyService } from "../../services";
import type { Society } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export function SocietyDetailScreen({ id }: { id: number }) {
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await societyService.getSocietyById(id);
        if (res.success && res.data) setSociety(res.data as Society);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!society) return <View style={styles.container}><Text style={styles.empty}>Society not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{society.name}</Text>
        <Text style={styles.detail}>Address: {society.address}</Text>
        <Text style={styles.detail}>City: {society.city}</Text>
        <Text style={styles.detail}>State: {society.state}</Text>
        <Text style={styles.detail}>Pincode: {society.pincode}</Text>
        <Text style={styles.detail}>Phone: {society.phone || "N/A"}</Text>
        <Text style={styles.detail}>Email: {society.email || "N/A"}</Text>
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
