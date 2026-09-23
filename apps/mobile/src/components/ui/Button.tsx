import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = "primary", loading = false, disabled = false, style }: ButtonProps) {
  const bgColor = variant === "primary" ? Colors.primary : variant === "danger" ? Colors.danger : variant === "outline" ? "transparent" : Colors.secondary;
  const textColor = variant === "outline" ? Colors.primary : Colors.white;
  const borderColor = variant === "outline" ? Colors.primary : "transparent";

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, borderColor, opacity: disabled || loading ? 0.6 : 1 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 48,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
