import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { flatService } from "../../services";
import type { Flat } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";

export function FlatListScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await flatService.getFlats();
      if (res.success && res.data) setFlats(res.data as Flat[]);
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

  const handleDelete = (item: Flat) => {
    Alert.alert("Delete Flat", `Delete flat ${item.flat_number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await flatService.deleteFlat(item.id);
            setFlats((prev) => prev.filter((f) => f.id !== item.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete flat");
          }
        },
      },
    ]);
  };

  const header = isAdmin ? (
    <View style={styles.headerActions}>
      <Button title="Add Flat" onPress={() => router.push("/flat/create")} />
    </View>
  ) : null;

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={flats}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/flat/${item.id}`)}>
              <Text style={styles.name}>Flat {item.flat_number}</Text>
              <Text style={styles.detail}>Block: {item.block || "N/A"} | Floor: {item.floor ?? "N/A"} | Type: {item.type || "N/A"}</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)} accessibilityLabel="Delete flat">
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No flats found</Text>}
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
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});