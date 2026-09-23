import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useAuth } from "../../components/auth/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../../constants";

export function ResidentProfileScreen() {
  const { user } = useAuth();

  const initials = (user?.name || "?")
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={styles.name}>{user?.name || "-"}</Text>
          <Text style={styles.role}>{user?.role || "-"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <Text style={styles.label}>Name: {user?.name || "-"}</Text>
        <Text style={styles.label}>Email: {user?.email || "-"}</Text>
        <Text style={styles.label}>Role: {user?.role || "-"}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xl, fontWeight: "bold" },
  avatarInfo: { marginLeft: Spacing.lg, flex: 1 },
  name: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  role: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  label: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
});