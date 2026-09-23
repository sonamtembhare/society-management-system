import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { flatService } from "../../services";
import type { Flat } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export function FlatDetailScreen({ id }: { id: number }) {
  const [flat, setFlat] = useState<Flat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await flatService.getFlatById(id);
        if (res.success && res.data) setFlat(res.data as Flat);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!flat) return <View style={styles.container}><Text style={styles.empty}>Flat not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>Flat {flat.flat_number}</Text>
        <Text style={styles.detail}>Block: {flat.block || "N/A"}</Text>
        <Text style={styles.detail}>Floor: {flat.floor ?? "N/A"}</Text>
        <Text style={styles.detail}>Type: {flat.type || "N/A"}</Text>
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
