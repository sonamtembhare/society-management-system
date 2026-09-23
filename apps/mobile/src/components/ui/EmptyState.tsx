import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, FontSize } from "../../constants";

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "No data found" }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  text: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: "center" },
});
