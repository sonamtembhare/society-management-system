import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { router } from "expo-router";
import { visitorService } from "../../services";
import type { Visitor } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export function VisitorListScreen() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await visitorService.getVisitors();
      if (res.success && res.data) setVisitors(res.data as Visitor[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={visitors}
        keyExtractor={(item) => String(item.id)}
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
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No visitors found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});
