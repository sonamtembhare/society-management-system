import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { noticeService } from "../../services";
import type { Notice } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";

export function NoticeListScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await noticeService.getNotices();
      if (res.success && res.data) setNotices(res.data as Notice[]);
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

  const handleDelete = (item: Notice) => {
    Alert.alert("Delete Notice", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await noticeService.deleteNotice(item.id);
            setNotices((prev) => prev.filter((n) => n.id !== item.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete notice");
          }
        },
      },
    ]);
  };

  const header = isAdmin ? (
    <View style={styles.headerActions}>
      <Button title="Add Notice" onPress={() => router.push("/notice/create")} />
    </View>
  ) : null;

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={notices}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/notice/${item.id}`)}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.priority] || Colors.gray400 }]}>
                  <Text style={styles.badgeText}>{item.priority}</Text>
                </View>
              </View>
              <Text style={styles.detail}>{item.notice_type} | {item.is_active ? "Active" : "Inactive"}</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)} accessibilityLabel="Delete notice">
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notices found</Text>}
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  deleteButton: { paddingLeft: Spacing.md, paddingVertical: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});