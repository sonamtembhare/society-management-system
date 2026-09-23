import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = Colors.primary }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
});
